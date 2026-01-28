package com.ocrs.gateway.filter;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * JWT Authentication Filter for API Gateway.
 * Validates JWT tokens and optionally checks for required roles.
 */
@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

        private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

        @Value("${jwt.secret}")
        private String jwtSecret;

        public JwtAuthFilter() {
                super(Config.class);
        }

        @Override
        public GatewayFilter apply(Config config) {
                return (exchange, chain) -> {
                        ServerHttpRequest request = exchange.getRequest();

                        // Check for Authorization header
                        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                                return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
                        }

                        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                                return onError(exchange, "Invalid Authorization header format",
                                                HttpStatus.UNAUTHORIZED);
                        }

                        String token = authHeader.substring(7);

                        try {
                                // Validate token and extract claims
                                Claims claims = validateToken(token);

                                // Check role if required
                                if (config.getRequiredRole() != null && !config.getRequiredRole().isEmpty()) {
                                        String userRole = claims.get("role", String.class);
                                        if (!config.getRequiredRole().equalsIgnoreCase(userRole)) {
                                                logger.warn("Access denied. Required role: {}, User role: {}",
                                                                config.getRequiredRole(), userRole);
                                                return onError(exchange, "Insufficient permissions",
                                                                HttpStatus.FORBIDDEN);
                                        }
                                }

                                // Add user info to headers for downstream services
                                ServerHttpRequest modifiedRequest = request.mutate()
                                                .header("X-User-Id", String.valueOf(claims.get("id", Long.class)))
                                                .header("X-User-Email", claims.getSubject())
                                                .header("X-User-Role", claims.get("role", String.class))
                                                .build();

                                return chain.filter(exchange.mutate().request(modifiedRequest).build());

                        } catch (ExpiredJwtException e) {
                                logger.warn("JWT token expired: {}", e.getMessage());
                                return onError(exchange, "Token expired", HttpStatus.UNAUTHORIZED);
                        } catch (JwtException e) {
                                logger.error("JWT validation failed: {}", e.getMessage());
                                return onError(exchange, "Invalid token", HttpStatus.UNAUTHORIZED);
                        }
                };
        }

        private Claims validateToken(String token) {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                return Jwts.parser()
                                .verifyWith(key)
                                .build()
                                .parseSignedClaims(token)
                                .getPayload();
        }

        private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
                ServerHttpResponse response = exchange.getResponse();
                response.setStatusCode(status);
                response.getHeaders().add("Content-Type", "application/json");

                String body = String.format("{\"success\":false,\"message\":\"%s\",\"data\":null}", message);
                return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
        }

        /**
         * Configuration class for the JWT filter.
         * Allows specifying required role for route access.
         */
        public static class Config {
                private String requiredRole;

                public String getRequiredRole() {
                        return requiredRole;
                }

                public void setRequiredRole(String requiredRole) {
                        this.requiredRole = requiredRole;
                }
        }
}
