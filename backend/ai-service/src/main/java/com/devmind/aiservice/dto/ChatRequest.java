package com.devmind.aiservice.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(@NotBlank(message = "must not be blank") String message) {}
