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

        /**
         * Provides a health check payload for the service.
         *
         * The response body is a Map containing:
         * <ul>
         *   <li><code>status</code>: "UP"</li>
         *   <li><code>service</code>: "api-gateway"</li>
         *   <li><code>timestamp</code>: current instant as an ISO-8601 string</li>
         * </ul>
         *
         * @return a ResponseEntity whose body is a Map with keys "status", "service", and "timestamp".
         */
        @GetMapping("/health")
        public Mono<ResponseEntity<Map<String, Object>>> health() {
                return Mono.just(ResponseEntity.ok(Map.of(
                                "status", "UP",
                                "service", "api-gateway",
                                "timestamp", Instant.now().toString())));
        }

        /**
         * Provides service metadata and a list of available endpoint patterns for the root (/) route.
         *
         * @return ResponseEntity containing a map with keys:
         *         - `service`: service name,
         *         - `version`: service version,
         *         - `status`: current service status,
         *         - `endpoints`: a nested map of route patterns (`auth`, `user`, `authority`, `admin`, `health`).
         */
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