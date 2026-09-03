package com.devmind.notificationservice.exception;

import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    public AppException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public static AppException notFound(String code, String message) {
        return new AppException(code, message, HttpStatus.NOT_FOUND);
    }

    public static AppException badRequest(String code, String message) {
        return new AppException(code, message, HttpStatus.BAD_REQUEST);
    }

    public String getCode() { return code; }
    public HttpStatus getStatus() { return status; }
}
