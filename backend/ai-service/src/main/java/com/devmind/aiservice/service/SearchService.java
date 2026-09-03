package com.devmind.aiservice.service;

import com.devmind.aiservice.dto.SearchResultDto;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class SearchService {

    private static final int SNIPPET_MAX_LINES = 12;

    private final RagService ragService;

    public SearchService(RagService ragService) {
        this.ragService = ragService;
    }

    public List<SearchResultDto> search(String repositoryId, String query) {
        return ragService.retrieve(repositoryId, query).allChunks().stream()
                .map(chunk -> new SearchResultDto(
                        chunk.filePath(),
                        chunk.language(),
                        chunk.startLine(),
                        chunk.endLine(),
                        truncate(chunk.content()),
                        chunk.score()
                ))
                .toList();
    }

    private String truncate(String content) {
        String[] lines = content.split("\n");
        if (lines.length <= SNIPPET_MAX_LINES) return content;
        return String.join("\n", java.util.Arrays.copyOfRange(lines, 0, SNIPPET_MAX_LINES)) + "\n…";
    }
}
