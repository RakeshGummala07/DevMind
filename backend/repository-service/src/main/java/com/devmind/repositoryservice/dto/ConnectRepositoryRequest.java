package com.devmind.repositoryservice.dto;

import jakarta.validation.constraints.NotBlank;

public record ConnectRepositoryRequest(@NotBlank String fullName) {}
