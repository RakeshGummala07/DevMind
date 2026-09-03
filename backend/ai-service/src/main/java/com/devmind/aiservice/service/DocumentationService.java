package com.devmind.aiservice.service;

import com.devmind.aiservice.client.OllamaClient;
import com.devmind.aiservice.client.QdrantSearchClient;
import com.devmind.aiservice.client.QdrantSearchClient.ScoredChunk;
import com.devmind.aiservice.domain.DocType;
import com.devmind.aiservice.domain.GeneratedDocument;
import com.devmind.aiservice.dto.GeneratedDocumentDto;
import com.devmind.aiservice.exception.AppException;
import com.devmind.aiservice.repository.GeneratedDocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DocumentationService {

    private static final Logger log = LoggerFactory.getLogger(DocumentationService.class);

    private static final Map<DocType, String> RETRIEVAL_QUERIES = new EnumMap<>(Map.of(
            DocType.README, "project overview purpose main features setup installation usage",
            DocType.ARCHITECTURE, "system architecture services components design data flow",
            DocType.API, "REST API endpoints controllers routes request response",
            DocType.ONBOARDING, "getting started prerequisites installation development workflow configuration"
    ));

    private static final Map<DocType, String> DOC_INSTRUCTIONS = new EnumMap<>(Map.of(
            DocType.README, "Write a README.md: a one-paragraph project overview, a Features section, and a Setup/Installation section with concrete commands where the context shows them.",
            DocType.ARCHITECTURE, "Write an ARCHITECTURE.md: describe the major components/services shown in the context, how they interact, and any notable design decisions visible in the code.",
            DocType.API, "Write an API.md: list the REST endpoints visible in the context (method, path, purpose) grouped by controller/resource.",
            DocType.ONBOARDING, "Write an ONBOARDING.md: a step-by-step guide for a new developer to get this project running locally, based only on what the context actually shows."
    ));

    private final OllamaClient ollamaClient;
    private final QdrantSearchClient qdrantSearchClient;
    private final GeneratedDocumentRepository documentRepository;

    private final double minRelevanceScore;
    private final int docSearchTopK;
    private final int docMaxContextChunks;
    private final int maxDocTokens;

    public DocumentationService(
            OllamaClient ollamaClient,
            QdrantSearchClient qdrantSearchClient,
            GeneratedDocumentRepository documentRepository,
            @Value("${devmind.min-relevance-score}") double minRelevanceScore,
            @Value("${devmind.doc-search-top-k}") int docSearchTopK,
            @Value("${devmind.doc-max-context-chunks}") int docMaxContextChunks,
            @Value("${devmind.max-doc-tokens}") int maxDocTokens
    ) {
        this.ollamaClient = ollamaClient;
        this.qdrantSearchClient = qdrantSearchClient;
        this.documentRepository = documentRepository;
        this.minRelevanceScore = minRelevanceScore;
        this.docSearchTopK = docSearchTopK;
        this.docMaxContextChunks = docMaxContextChunks;
        this.maxDocTokens = maxDocTokens;
    }

    public GeneratedDocumentDto generate(String repositoryId, DocType docType, String userId) {
        String query = RETRIEVAL_QUERIES.get(docType);
        List<Float> queryVector = ollamaClient.embed(query);
        List<ScoredChunk> allChunks = qdrantSearchClient.search(repositoryId, queryVector, docSearchTopK);

        List<ScoredChunk> relevant = allChunks.stream()
                .filter(chunk -> chunk.score() >= minRelevanceScore)
                .toList();

        log.info("Doc retrieval for repo {} ({}): {} chunks returned, {} above relevance threshold {}",
                repositoryId, docType, allChunks.size(), relevant.size(), minRelevanceScore);

        if (relevant.isEmpty()) {
            throw AppException.badRequest("INSUFFICIENT_CONTEXT",
                    "Not enough indexed content was found to generate a " + docType + " document. Try indexing the repository first.");
        }

        List<ScoredChunk> contextChunks = relevant.size() > docMaxContextChunks
                ? relevant.subList(0, docMaxContextChunks)
                : relevant;

        String prompt = buildPrompt(docType, contextChunks);

        log.info("Calling Ollama to generate {} for repo {} ({} of {} relevant chunks in context, {} chars of prompt)",
                docType, repositoryId, contextChunks.size(), relevant.size(), prompt.length());
        long start = System.currentTimeMillis();

        String content = ollamaClient.generate(prompt, maxDocTokens);

        log.info("Ollama generate() for {} finished for repo {} in {}ms", docType, repositoryId, System.currentTimeMillis() - start);

        List<String> sourcePaths = contextChunks.stream()
                .map(chunk -> chunk.filePath() + ":" + chunk.startLine() + "-" + chunk.endLine())
                .distinct()
                .toList();

        GeneratedDocument saved = documentRepository.save(
                GeneratedDocument.create(repositoryId, docType, content, sourcePaths, true, userId));

        return GeneratedDocumentDto.from(saved);
    }

    public List<GeneratedDocumentDto> listLatestPerType(String repositoryId) {
        List<GeneratedDocument> all = documentRepository.findByRepositoryIdOrderByGeneratedAtDesc(repositoryId);

        Map<DocType, GeneratedDocument> latestByType = new EnumMap<>(DocType.class);
        for (GeneratedDocument doc : all) {
            latestByType.putIfAbsent(doc.getDocType(), doc); // first seen per type is the latest, since list is desc-sorted
        }

        return latestByType.values().stream().map(GeneratedDocumentDto::from).toList();
    }

    public GeneratedDocumentDto getLatest(String repositoryId, DocType docType) {
        return documentRepository.findFirstByRepositoryIdAndDocTypeOrderByGeneratedAtDesc(repositoryId, docType)
                .map(GeneratedDocumentDto::from)
                .orElseThrow(() -> AppException.notFound("DOCUMENT_NOT_FOUND",
                        "No " + docType + " document has been generated for this repository yet"));
    }

    private String buildPrompt(DocType docType, List<ScoredChunk> chunks) {
        String context = chunks.stream()
                .map(chunk -> "### %s (lines %d-%d)\n```%s\n%s\n```".formatted(
                        chunk.filePath(), chunk.startLine(), chunk.endLine(),
                        chunk.language() == null ? "" : chunk.language().toLowerCase(), chunk.content()))
                .collect(Collectors.joining("\n\n"));

        return """
                You are DevMind, an AI assistant that writes developer documentation for a codebase using ONLY the source code excerpts provided below.

                Rules you must follow:
                - Use ONLY what the context shows. Do not invent files, classes, endpoints, or setup steps that aren't evidenced in the context.
                - Where the context doesn't cover something a real document like this would normally include, leave it out rather than guessing.
                - Output valid Markdown with clear headings.
                - Be concrete and technical — this is for a developer, not a marketing page.

                Task: %s

                Context (retrieved from the indexed repository):
                %s

                Document:
                """.formatted(DOC_INSTRUCTIONS.get(docType), context);
    }
}
