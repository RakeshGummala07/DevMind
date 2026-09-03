package com.devmind.notificationservice.web;

import java.time.Instant;

public record ErrorResponse(boolean success, ErrorBody error, Instant timestamp) {
    public record ErrorBody(String code, String message) {}
    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(false, new ErrorBody(code, message), Instant.now());
    }
}
