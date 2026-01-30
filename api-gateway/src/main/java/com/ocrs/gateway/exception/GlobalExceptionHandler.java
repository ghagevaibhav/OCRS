package com.ocrs.gateway.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeoutException;

/**
 * Global exception handler for the API Gateway.
 * Provides consistent, structured error responses for all gateway errors.
 * 
 * Error response format:
 * {
 * "success": false,
 * "message": "Human-readable error message",
 * "path": "/api/resource",
 * "timestamp": "2026-01-29T21:00:00",
 * "errorCode": "MACHINE_READABLE_CODE",
 * "status": 500
 * }
 */
@Component
@Order(-1)
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

        private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
        private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        @Override
        @NonNull
        public Mono<Void> handle(@NonNull ServerWebExchange exchange, @NonNull Throwable ex) {
                String path = exchange.getRequest().getPath().toString();
                HttpStatus status;
                String message;
                String errorCode;

                // Handle specific exception types with appropriate responses
                if (ex instanceof ResponseStatusException rse) {
                        status = HttpStatus.valueOf(rse.getStatusCode().value());
                        message = rse.getReason() != null ? rse.getReason() : getDefaultMessage(status);
                        errorCode = getErrorCodeForStatus(status);
                        if (status.is5xxServerError()) {
                                logger.error("Response status exception on path {}: {}", path, ex.getMessage());
                        } else {
                                logger.warn("Response status exception on path {}: {}", path, message);
                        }
                } else if (ex instanceof NotFoundException) {
                        status = HttpStatus.SERVICE_UNAVAILABLE;
                        message = "Service temporarily unavailable. Please try again later.";
                        errorCode = "SERVICE_UNAVAILABLE";
                        logger.error("Service not found for path {}: {}", path, ex.getMessage());
                } else if (ex instanceof ConnectException) {
                        status = HttpStatus.SERVICE_UNAVAILABLE;
                        message = "Unable to connect to downstream service";
                        errorCode = "CONNECTION_FAILED";
                        logger.error("Connection failed for path {}: {}", path, ex.getMessage());
                } else if (ex instanceof TimeoutException) {
                        status = HttpStatus.GATEWAY_TIMEOUT;
                        message = "Request timed out. Please try again.";
                        errorCode = "GATEWAY_TIMEOUT";
                        logger.error("Timeout for path {}: {}", path, ex.getMessage());
                } else if (ex.getCause() instanceof ConnectException) {
                        status = HttpStatus.SERVICE_UNAVAILABLE;
                        message = "Unable to connect to downstream service";
                        errorCode = "CONNECTION_FAILED";
                        logger.error("Connection failed (nested) for path {}: {}", path, ex.getMessage());
                } else {
                        status = HttpStatus.INTERNAL_SERVER_ERROR;
                        message = "An unexpected error occurred";
                        errorCode = "INTERNAL_ERROR";
                        logger.error("Unhandled exception on path {}", path, ex);
                }

                return buildErrorResponse(exchange, message, status, path, errorCode);
        }

        /**
         * Build a structured JSON error response.
         */
        private Mono<Void> buildErrorResponse(ServerWebExchange exchange, String message,
                        HttpStatus status, String path, String errorCode) {
                exchange.getResponse().setStatusCode(status);
                exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

                String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMATTER);

                String body = String.format(
                                "{\"success\":false,\"message\":\"%s\",\"path\":\"%s\",\"timestamp\":\"%s\",\"errorCode\":\"%s\",\"status\":%d}",
                                escapeJsonString(message),
                                escapeJsonString(path),
                                timestamp,
                                errorCode,
                                status.value());

                // Note: CORS headers are handled by CorsWebFilter at highest precedence

                DataBuffer buffer = exchange.getResponse().bufferFactory()
                                .wrap(body.getBytes(StandardCharsets.UTF_8));
                return exchange.getResponse().writeWith(Mono.just(buffer));
        }

        /**
         * Get default message for HTTP status code.
         */
        private String getDefaultMessage(HttpStatus status) {
                return switch (status) {
                        case UNAUTHORIZED -> "Authentication required";
                        case FORBIDDEN -> "Access denied";
                        case NOT_FOUND -> "Resource not found";
                        case BAD_REQUEST -> "Invalid request";
                        case SERVICE_UNAVAILABLE -> "Service temporarily unavailable";
                        case GATEWAY_TIMEOUT -> "Request timed out";
                        case TOO_MANY_REQUESTS -> "Too many requests. Please slow down.";
                        default -> status.getReasonPhrase();
                };
        }

        /**
         * Get machine-readable error code for HTTP status.
         */
        private String getErrorCodeForStatus(HttpStatus status) {
                return switch (status) {
                        case UNAUTHORIZED -> "UNAUTHORIZED";
                        case FORBIDDEN -> "FORBIDDEN";
                        case NOT_FOUND -> "NOT_FOUND";
                        case BAD_REQUEST -> "BAD_REQUEST";
                        case SERVICE_UNAVAILABLE -> "SERVICE_UNAVAILABLE";
                        case GATEWAY_TIMEOUT -> "GATEWAY_TIMEOUT";
                        case TOO_MANY_REQUESTS -> "RATE_LIMITED";
                        case INTERNAL_SERVER_ERROR -> "INTERNAL_ERROR";
                        default -> status.name();
                };
        }

        /**
         * Escape special characters in JSON string values.
         */
        private String escapeJsonString(String value) {
                if (value == null) {
                        return "";
                }
                return value.replace("\\", "\\\\")
                                .replace("\"", "\\\"")
                                .replace("\n", "\\n")
                                .replace("\r", "\\r")
                                .replace("\t", "\\t");
        }
}
