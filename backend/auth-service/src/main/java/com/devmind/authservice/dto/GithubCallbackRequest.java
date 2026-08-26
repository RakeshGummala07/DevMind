package com.devmind.authservice.dto;

import jakarta.validation.constraints.NotBlank;

public record GithubCallbackRequest(@NotBlank String code) {}
