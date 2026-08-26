package com.devmind.authservice.dto;

public record AuthResponse(UserDto user, String accessToken) {}
