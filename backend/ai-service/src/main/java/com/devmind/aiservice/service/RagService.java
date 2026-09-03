package com.devmind.aiservice.service;

import com.devmind.aiservice.client.OllamaClient;
import com.devmind.aiservice.client.QdrantSearchClient;
import com.devmind.aiservice.client.QdrantSearchClient.ScoredChunk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);

    public static final String INSUFFICIENT_EVIDENCE_MESSAGE =
            "I couldn't find sufficient evidence in the indexed repository to answer this confidently.";

    private final OllamaClient ollamaClient;
    private final QdrantSearchClient qdrantSearchClient;
    private final double minRelevanceScore;
    private final int searchTopK;
    private final int maxContextChunks;

    public RagService(
            OllamaClient ollamaClient,
            QdrantSearchClient qdrantSearchClient,
            @Value("${devmind.min-relevance-score}") double minRelevanceScore,
            @Value("${devmind.search-top-k}") int searchTopK,
            @Value("${devmind.max-context-chunks}") int maxContextChunks
    ) {
        this.ollamaClient = ollamaClient;
        this.qdrantSearchClient = qdrantSearchClient;
        this.minRelevanceScore = minRelevanceScore;
        this.searchTopK = searchTopK;
        this.maxContextChunks = maxContextChunks;
    }

    public record RetrievalResult(List<ScoredChunk> relevantChunks, List<ScoredChunk> allChunks) {}
    public record GroundedAnswer(String text, List<ScoredChunk> usedChunks, boolean grounded) {}

    public RetrievalResult retrieve(String repositoryId, String query) {
        List<Float> queryVector = ollamaClient.embed(query);
        List<ScoredChunk> allChunks = qdrantSearchClient.search(repositoryId, queryVector, searchTopK);

        List<ScoredChunk> relevant = allChunks.stream()
                .filter(chunk -> chunk.score() >= minRelevanceScore)
                .toList();

        log.info("Retrieval for repo {}: {} chunks returned, {} above relevance threshold {}",
                repositoryId, allChunks.size(), relevant.size(), minRelevanceScore);

        return new RetrievalResult(relevant, allChunks);
    }

    public GroundedAnswer answer(String repositoryId, String question) {
        RetrievalResult retrieval = retrieve(repositoryId, question);

        if (retrieval.relevantChunks().isEmpty()) {
            return new GroundedAnswer(INSUFFICIENT_EVIDENCE_MESSAGE, List.of(), false);
        }

        List<ScoredChunk> contextChunks = retrieval.relevantChunks().size() > maxContextChunks
                ? retrieval.relevantChunks().subList(0, maxContextChunks)
                : retrieval.relevantChunks();

        String prompt = buildPrompt(question, contextChunks);

        log.info("Calling Ollama to generate an answer for repo {} ({} of {} relevant chunks in context, {} chars of prompt)",
                repositoryId, contextChunks.size(), retrieval.relevantChunks().size(), prompt.length());
        long start = System.currentTimeMillis();

        String rawAnswer = ollamaClient.generate(prompt);

        log.info("Ollama generate() finished for repo {} in {}ms", repositoryId, System.currentTimeMillis() - start);

        return new GroundedAnswer(rawAnswer, contextChunks, true);
    }

    private String buildPrompt(String question, List<ScoredChunk> chunks) {
        String context = chunks.stream()
                .map(chunk -> "### %s (lines %d-%d)\n```%s\n%s\n```".formatted(
                        chunk.filePath(), chunk.startLine(), chunk.endLine(),
                        chunk.language() == null ? "" : chunk.language().toLowerCase(), chunk.content()))
                .collect(Collectors.joining("\n\n"));

        return """
                You are DevMind, an AI assistant that answers questions about a codebase using ONLY the source code excerpts provided below.

                Rules you must follow:
                - Answer using ONLY the code shown in the context. Do not invent files, classes, methods, or behavior that isn't shown.
                - If the context is insufficient to answer confidently, say so directly instead of guessing.
                - Reference specific file paths from the context when relevant to your answer.
                - Be concise and direct — this is a technical answer for a developer, not a tutorial.

                Context (retrieved from the indexed repository):
                %s

                Question: %s

                Answer:
                """.formatted(context, question);
    }
}