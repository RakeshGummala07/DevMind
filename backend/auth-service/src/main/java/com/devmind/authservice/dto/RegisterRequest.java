package com.devmind.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "must not be blank") String name,
        @NotBlank @Email(message = "must be a valid email") String email,
        @NotBlank @Size(min = 8, message = "must be at least 8 characters") String password
) {}
