package com.ocrs.gateway.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Global exception handler for the API Gateway.
 * Provides consistent error responses for all gateway errors.
 */
@Component
@Order(-1)
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

        private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @Override
        @NonNull
        public Mono<Void> handle(@NonNull ServerWebExchange exchange, @NonNull Throwable ex) {
                HttpStatus status;
                String message;

                if (ex instanceof ResponseStatusException rse) {
                        status = HttpStatus.valueOf(rse.getStatusCode().value());
                        message = rse.getReason() != null ? rse.getReason() : "Request failed";
                } else {
                        status = HttpStatus.INTERNAL_SERVER_ERROR;
                        message = "An unexpected error occurred";
                        logger.error("Unhandled exception in gateway", ex);
                }

                exchange.getResponse().setStatusCode(status);
                exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

                String body = String.format(
                                "{\"success\":false,\"message\":\"%s\",\"data\":null,\"status\":%d}",
                                message, status.value());

                return exchange.getResponse().writeWith(
                                Mono.just(exchange.getResponse().bufferFactory().wrap(body.getBytes())));
        }
}
