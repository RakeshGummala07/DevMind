package com.devmind.aiservice.dto;

public record SourceDto(String filePath, String githubFullName, int startLine, int endLine) {}
