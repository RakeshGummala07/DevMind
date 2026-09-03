package com.devmind.analysisservice.web;

import java.time.Instant;

public record ApiResponse<T>(boolean success, T data, String message, Instant timestamp) {
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message, Instant.now());
    }
    public static <T> ApiResponse<T> ok(T data) {
        return ok(data, "Operation completed successfully");
    }
}
