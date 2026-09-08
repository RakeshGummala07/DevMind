package com.devmind.authservice.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateRoleRequest(@NotBlank String role) {}
