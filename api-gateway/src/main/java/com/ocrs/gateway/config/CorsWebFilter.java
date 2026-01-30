package com.ocrs.gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

/**
 * High-priority CORS WebFilter for Spring Cloud Gateway.
 * 
 * This filter runs at the HIGHEST_PRECEDENCE to ensure CORS headers are applied
 * BEFORE any other filter (including JWT validation) processes the request.
 * 
 * Key behaviors:
 * 1. Handles OPTIONS preflight requests immediately with 200 OK and CORS
 * headers
 * 2. Adds CORS headers to ALL responses (success and error)
 * 3. Runs before the gateway routes are matched, preventing 403 on preflight
 * 
 * This solves the issue where OPTIONS requests were rejected with 403 because
 * they didn't match route method predicates (GET, POST, PUT, PATCH).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsWebFilter implements WebFilter {

        private static final Logger logger = LoggerFactory.getLogger(CorsWebFilter.class);

        @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
        private String allowedOriginsConfig;

        private static final List<String> ALLOWED_METHODS = Arrays.asList(
                        "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD");

        private static final List<String> ALLOWED_HEADERS = Arrays.asList(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Origin",
                        "X-Requested-With",
                        "Access-Control-Request-Method",
                        "Access-Control-Request-Headers",
                        "X-Request-Id",
                        "Cache-Control");

        private static final List<String> EXPOSED_HEADERS = Arrays.asList(
                        "X-Request-Id",
                        "X-RateLimit-Remaining",
                        "X-RateLimit-Limit",
                        "X-RateLimit-Reset");

        private static final long MAX_AGE = 3600L; // 1 hour cache for preflight

        @Override
        @NonNull
        public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
                ServerHttpRequest request = exchange.getRequest();
                ServerHttpResponse response = exchange.getResponse();
                String origin = request.getHeaders().getOrigin();

                // Only process if Origin header is present (CORS request)
                if (origin == null) {
                        return chain.filter(exchange);
                }

                // Validate origin against allowed origins
                if (!isOriginAllowed(origin)) {
                        logger.warn("Blocked CORS request from disallowed origin: {}", origin);
                        response.setStatusCode(HttpStatus.FORBIDDEN);
                        return response.setComplete();
                }

                // Add CORS headers to response
                addCorsHeaders(response, origin);

                // Handle OPTIONS preflight request - return immediately with 200 OK
                if (HttpMethod.OPTIONS.equals(request.getMethod())) {
                        logger.debug("Handling CORS preflight for path: {} from origin: {}",
                                        request.getPath(), origin);
                        response.setStatusCode(HttpStatus.OK);
                        return response.setComplete();
                }

                // For non-preflight requests, continue the filter chain
                // The CORS headers are already added and will be included in any response
                return chain.filter(exchange);
        }

        /**
         * Check if the origin is in the allowed list.
         * Supports wildcard patterns like http://localhost:*
         */
        private boolean isOriginAllowed(String origin) {
                if (origin == null) {
                        return false;
                }

                String[] allowedOrigins = allowedOriginsConfig.split(",");
                for (String allowed : allowedOrigins) {
                        allowed = allowed.trim();

                        // Exact match
                        if (allowed.equals(origin)) {
                                return true;
                        }

                        // Wildcard port matching (e.g., http://localhost:*)
                        if (allowed.contains(":*")) {
                                String basePattern = allowed.replace(":*", ":");
                                if (origin.startsWith(basePattern)) {
                                        // Check if what follows the base is a valid port number
                                        String remainder = origin.substring(basePattern.length());
                                        if (remainder.matches("\\d+")) {
                                                return true;
                                        }
                                }

                                // Also match without port (e.g., http://localhost)
                                String baseWithoutPort = allowed.replace(":*", "");
                                if (origin.equals(baseWithoutPort)) {
                                        return true;
                                }
                        }

                        // Pattern matching with * as wildcard
                        if (allowed.contains("*")) {
                                String regex = allowed
                                                .replace(".", "\\.")
                                                .replace("*", ".*");
                                if (origin.matches(regex)) {
                                        return true;
                                }
                        }
                }
                return false;
        }
 
        //add necessary CORS headers to the response.
         
        private void addCorsHeaders(ServerHttpResponse response, String origin) {
                HttpHeaders headers = response.getHeaders();

                // Set the specific origin (not wildcard) since we allow credentials
                headers.set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
                headers.set(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
                headers.set(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, String.join(", ", ALLOWED_METHODS));
                headers.set(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, String.join(", ", ALLOWED_HEADERS));
                headers.set(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, String.join(", ", EXPOSED_HEADERS));
                headers.set(HttpHeaders.ACCESS_CONTROL_MAX_AGE, String.valueOf(MAX_AGE));

                // Add Vary header to indicate response varies based on Origin
                headers.add(HttpHeaders.VARY, HttpHeaders.ORIGIN);
                headers.add(HttpHeaders.VARY, HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD);
                headers.add(HttpHeaders.VARY, HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS);
        }
}
