package com.ocrs.gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

/**
 * Health check controller for the API Gateway.
 */
@RestController
public class HealthController {

        @GetMapping("/health")
        public Mono<ResponseEntity<Map<String, Object>>> health() {
                return Mono.just(ResponseEntity.ok(Map.of(
                                "status", "UP",
                                "service", "api-gateway",
                                "timestamp", Instant.now().toString())));
        }

        @GetMapping("/")
        public Mono<ResponseEntity<Map<String, Object>>> root() {
                return Mono.just(ResponseEntity.ok(Map.of(
                                "service", "OCRS API Gateway",
                                "version", "1.0.0",
                                "status", "Running",
                                "endpoints", Map.of(
                                                "auth", "/api/auth/**",
                                                "user", "/api/user/**",
                                                "authority", "/api/authority/**",
                                                "admin", "/api/admin/**",
                                                "health", "/health"))));
        }
}
