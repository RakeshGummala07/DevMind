package com.devmind.aiservice.dto;

import jakarta.validation.constraints.NotBlank;

public record GenerateDocumentRequest(@NotBlank String docType) {}
