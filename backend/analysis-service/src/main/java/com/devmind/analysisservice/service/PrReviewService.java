package com.devmind.analysisservice.service;

import com.devmind.analysisservice.client.*;
import com.devmind.analysisservice.client.GithubPullRequestClient.ChangedFile;
import com.devmind.analysisservice.client.GithubPullRequestClient.PullRequestSummary;
import com.devmind.analysisservice.client.QdrantSearchClient.ScoredChunk;
import com.devmind.analysisservice.client.RepositoryServiceClient.RepositoryInfo;
import com.devmind.analysisservice.domain.FindingSeverity;
import com.devmind.analysisservice.domain.PrReview;
import com.devmind.analysisservice.domain.PrReviewFinding;
import com.devmind.analysisservice.event.PrReviewEventPublisher;
import com.devmind.analysisservice.repository.PrReviewFindingRepository;
import com.devmind.analysisservice.repository.PrReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PrReviewService {

    private static final Logger log = LoggerFactory.getLogger(PrReviewService.class);

    private static final Pattern FINDING_LINE = Pattern.compile(
            "^(INFO|MINOR|MAJOR|CRITICAL|NONE)\\s*:\\s*(.+)$", Pattern.CASE_INSENSITIVE);

    private static final int MAX_FINDINGS_PER_FILE = 5;

    private final PrReviewRepository prReviewRepository;
    private final PrReviewFindingRepository findingRepository;
    private final RepositoryServiceClient repositoryServiceClient;
    private final AuthServiceClient authServiceClient;
    private final GithubPullRequestClient githubPullRequestClient;
    private final OllamaClient ollamaClient;
    private final QdrantSearchClient qdrantSearchClient;
    private final PrReviewEventPublisher eventPublisher;

    private final int maxFilesPerReview;
    private final int maxPatchChars;
    private final Set<String> excludedFilenames;
    private final double minRelevanceScore;
    private final int searchTopK;
    private final int maxContextChunks;

    public PrReviewService(
            PrReviewRepository prReviewRepository,
            PrReviewFindingRepository findingRepository,
            RepositoryServiceClient repositoryServiceClient,
            AuthServiceClient authServiceClient,
            GithubPullRequestClient githubPullRequestClient,
            OllamaClient ollamaClient,
            QdrantSearchClient qdrantSearchClient,
            PrReviewEventPublisher eventPublisher,
            @Value("${devmind.pr-review.max-files-per-review}") int maxFilesPerReview,
            @Value("${devmind.pr-review.max-patch-chars}") int maxPatchChars,
            @Value("${devmind.pr-review.excluded-filenames}") Set<String> excludedFilenames,
            @Value("${devmind.min-relevance-score}") double minRelevanceScore,
            @Value("${devmind.search-top-k}") int searchTopK,
            @Value("${devmind.max-context-chunks}") int maxContextChunks
    ) {
        this.prReviewRepository = prReviewRepository;
        this.findingRepository = findingRepository;
        this.repositoryServiceClient = repositoryServiceClient;
        this.authServiceClient = authServiceClient;
        this.githubPullRequestClient = githubPullRequestClient;
        this.ollamaClient = ollamaClient;
        this.qdrantSearchClient = qdrantSearchClient;
        this.eventPublisher = eventPublisher;
        this.maxFilesPerReview = maxFilesPerReview;
        this.maxPatchChars = maxPatchChars;
        this.excludedFilenames = excludedFilenames;
        this.minRelevanceScore = minRelevanceScore;
        this.searchTopK = searchTopK;
        this.maxContextChunks = maxContextChunks;
    }


    @Transactional
    public PrReview createPendingReview(String repositoryId, int prNumber, String requestedByUserId) {
        PrReview review = PrReview.start(repositoryId, prNumber, requestedByUserId);
        return prReviewRepository.save(review);
    }


    @Async
    public void runReviewAsync(String reviewId) {
        PrReview review = prReviewRepository.findById(reviewId).orElse(null);
        if (review == null) {
            log.error("runReviewAsync called with unknown reviewId {}", reviewId);
            return;
        }

        try {
            RepositoryInfo repoInfo = repositoryServiceClient.getRepository(review.getRepositoryId());
            String[] ownerRepo = repoInfo.fullName().split("/", 2);
            if (ownerRepo.length != 2) {
                throw new IllegalStateException("Unexpected repository full name shape: " + repoInfo.fullName());
            }
            String owner = ownerRepo[0];
            String repoName = ownerRepo[1];

            String githubToken = authServiceClient.getGithubToken(review.getRequestedByUserId()).githubAccessToken();

            PullRequestSummary prSummary = githubPullRequestClient.getPullRequest(githubToken, owner, repoName, review.getPrNumber());
            review.markRunning(prSummary.title(), prSummary.headSha(), prSummary.baseSha());
            prReviewRepository.save(review);

            List<ChangedFile> changedFiles = githubPullRequestClient.listChangedFiles(githubToken, owner, repoName, review.getPrNumber());
            List<ChangedFile> eligible = changedFiles.stream()
                    .filter(this::isEligible)
                    .limit(maxFilesPerReview)
                    .toList();

            if (changedFiles.size() > eligible.size()) {
                log.info("PR #{} on {}: {} changed files, reviewing {} after exclusions/cap",
                        review.getPrNumber(), repoInfo.fullName(), changedFiles.size(), eligible.size());
            }

            int totalFindings = 0;
            for (ChangedFile file : eligible) {
                totalFindings += reviewFile(review, file);
            }

            String summary = buildSummary(eligible.size(), totalFindings, changedFiles.size());
            review.markCompleted(eligible.size(), totalFindings, summary);
            prReviewRepository.save(review);
            eventPublisher.publishCompleted(review);

            log.info("PR review {} completed: {} files reviewed, {} findings", reviewId, eligible.size(), totalFindings);

        } catch (Exception e) {
            log.error("PR review {} failed: {}", reviewId, e.getMessage(), e);
            review.markFailed(truncate(e.getMessage(), 2000));
            prReviewRepository.save(review);
            eventPublisher.publishCompleted(review);
        }
    }

    private boolean isEligible(ChangedFile file) {
        String filename = file.filename();
        String basename = filename.substring(filename.lastIndexOf('/') + 1);
        if (excludedFilenames.contains(basename)) return false;
        if ("removed".equals(file.status())) return false; // nothing left to review
        return file.patch() != null && !file.patch().isBlank();
    }

    private int reviewFile(PrReview review, ChangedFile file) {
        String patch = truncate(file.patch(), maxPatchChars);

        List<ScoredChunk> context = retrieveContext(review.getRepositoryId(), file, patch);
        boolean grounded = !context.isEmpty();

        String prompt = buildPrompt(file.filename(), patch, context);

        String rawResponse;
        try {
            rawResponse = ollamaClient.generate(prompt);
        } catch (Exception e) {
            log.warn("Ollama generate failed for {} in review {}: {} — skipping this file",
                    file.filename(), review.getId(), e.getMessage());
            return 0;
        }

        List<PrReviewFinding> findings = parseFindings(review.getId(), file.filename(), rawResponse, grounded);
        if (!findings.isEmpty()) {
            findingRepository.saveAll(findings);
        }
        return findings.size();
    }

    private List<ScoredChunk> retrieveContext(String repositoryId, ChangedFile file, String patch) {
        try {
            List<Float> queryVector = ollamaClient.embed(file.filename() + "\n" + patch);
            List<ScoredChunk> allChunks = qdrantSearchClient.search(repositoryId, queryVector, searchTopK);
            List<ScoredChunk> relevant = allChunks.stream()
                    .filter(c -> c.score() >= minRelevanceScore)
                    .toList();
            return relevant.size() > maxContextChunks ? relevant.subList(0, maxContextChunks) : relevant;
        } catch (Exception e) {
            // Retrieval is an enhancement, not a hard requirement — a review
            // that runs ungrounded (diff-only) is still better than no review.
            log.warn("Context retrieval failed for {}: {} — reviewing diff-only", file.filename(), e.getMessage());
            return List.of();
        }
    }

    private String buildPrompt(String filePath, String patch, List<ScoredChunk> context) {
        String contextBlock = context.isEmpty()
                ? "(No additional repository context was retrieved for this file.)"
                : context.stream()
                .map(c -> "### %s (lines %d-%d)\n```\n%s\n```".formatted(c.filePath(), c.startLine(), c.endLine(), c.content()))
                .reduce((a, b) -> a + "\n\n" + b)
                .orElse("");

        return """
                You are DevMind, an AI code reviewer. Review ONLY the diff below for %s.

                Rules you must follow:
                - Only flag real, specific issues: bugs, security problems, missing error handling, or clearly poor practice.
                - Do NOT comment on formatting, style preferences, or anything not visibly wrong in the diff.
                - Respond with ONE finding per line, in this exact format: SEVERITY: message
                  where SEVERITY is one of INFO, MINOR, MAJOR, CRITICAL.
                - If there are no significant issues, respond with exactly: NONE: No significant issues found
                - Do not add any other text, headers, or explanation outside this format.

                Related repository context (may or may not be relevant):
                %s

                Diff for %s:
                ```diff
                %s
                ```

                Findings:
                """.formatted(filePath, contextBlock, filePath, patch);
    }

    private List<PrReviewFinding> parseFindings(String reviewId, String filePath, String rawResponse, boolean grounded) {
        List<PrReviewFinding> findings = new java.util.ArrayList<>();
        for (String line : rawResponse.lines().toList()) {
            Matcher matcher = FINDING_LINE.matcher(line.trim());
            if (!matcher.matches()) continue;

            String severityToken = matcher.group(1).toUpperCase();
            if ("NONE".equals(severityToken)) continue;

            FindingSeverity severity = FindingSeverity.valueOf(severityToken);
            String message = matcher.group(2).trim();
            if (message.isEmpty()) continue;

            findings.add(PrReviewFinding.of(reviewId, filePath, severity, message, null, grounded));
            if (findings.size() >= MAX_FINDINGS_PER_FILE) break;
        }
        return findings;
    }

    private String buildSummary(int filesReviewed, int totalFindings, int totalChangedFiles) {
        if (totalFindings == 0) {
            return "Reviewed " + filesReviewed + " of " + totalChangedFiles + " changed files — no significant issues found.";
        }
        return "Reviewed " + filesReviewed + " of " + totalChangedFiles + " changed files — "
                + totalFindings + " finding(s) to review.";
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
