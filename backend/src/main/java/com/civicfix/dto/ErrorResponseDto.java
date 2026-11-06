package com.civicfix.dto;

import java.time.Instant;
import java.util.List;

/**
 * ErrorResponseDto - Standardized API Error Representation
 */
public class ErrorResponseDto {

    private boolean success = false;
    private int status;
    private String error;
    private String message;
    private Instant timestamp = Instant.now();
    private List<FieldErrorDetail> fieldErrors;

    public ErrorResponseDto() {}

    public ErrorResponseDto(int status, String error, String message) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.timestamp = Instant.now();
    }

    public static class FieldErrorDetail {
        private String field;
        private Object rejectedValue;
        private String message;

        public FieldErrorDetail(String field, Object rejectedValue, String message) {
            this.field = field;
            this.rejectedValue = rejectedValue;
            this.message = message;
        }

        public String getField() { return field; }
        public Object getRejectedValue() { return rejectedValue; }
        public String getMessage() { return message; }
    }

    public boolean isSuccess() { return success; }
    public int getStatus() { return status; }
    public String getError() { return error; }
    public String getMessage() { return message; }
    public Instant getTimestamp() { return timestamp; }
    public List<FieldErrorDetail> getFieldErrors() { return fieldErrors; }
    public void setFieldErrors(List<FieldErrorDetail> fieldErrors) { this.fieldErrors = fieldErrors; }
}
