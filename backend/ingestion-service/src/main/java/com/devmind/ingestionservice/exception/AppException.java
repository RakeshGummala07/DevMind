package com.devmind.ingestionservice.exception;

import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    public AppException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public static AppException badRequest(String code, String message) {
        return new AppException(code, message, HttpStatus.BAD_REQUEST);
    }

    public static AppException unauthorized(String code, String message) {
        return new AppException(code, message, HttpStatus.UNAUTHORIZED);
    }

    public String getCode() { return code; }
    public HttpStatus getStatus() { return status; }
}
