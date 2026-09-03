package com.devmind.aiservice.dto;

public record SearchResultDto(
        String filePath, String language, int startLine, int endLine,
        String snippet, double relevance
) {}
