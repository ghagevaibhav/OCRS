package com.ocrs.gateway.filter;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * jwt authentication filter for api gateway.
 * validates jwt tokens and optionally checks for required roles.
 * 
 * provides consistent, structured json error responses matching
 * the format used in auth-service and backend-monolith.
 */
@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

        private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);
        private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        @Value("${jwt.secret}")
        private String jwtSecret;

        public JwtAuthFilter() {
                super(Config.class);
        }

        @Override
        public GatewayFilter apply(Config config) {
                return (exchange, chain) -> {
                        ServerHttpRequest request = exchange.getRequest();
                        String path = request.getPath().toString();

                        // skip jwt validation for OPTIONS preflight requests
                        // preflight requests never carry authorization headers
                        if (request.getMethod() == org.springframework.http.HttpMethod.OPTIONS) {
                                logger.debug("Skipping JWT validation for OPTIONS preflight request: {}", path);
                                return chain.filter(exchange);
                        }

                        // check for Authorization header
                        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                                logger.warn("Missing Authorization header for path: {}", path);
                                return buildErrorResponse(exchange, "Missing Authorization header",
                                                HttpStatus.UNAUTHORIZED, path, "MISSING_TOKEN");
                        }

                        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                                logger.warn("Invalid Authorization header format for path: {}", path);
                                return buildErrorResponse(exchange, "Invalid Authorization header format",
                                                HttpStatus.UNAUTHORIZED, path, "INVALID_TOKEN_FORMAT");
                        }

                        String token = authHeader.substring(7);

                        try {
                                // validate token and extract claims (single parse operation)
                                Claims claims = validateAndExtractClaims(token);

                                // check role if required
                                if (config.getRequiredRole() != null && !config.getRequiredRole().isEmpty()) {
                                        String userRole = claims.get("role", String.class);
                                        if (userRole == null || !config.getRequiredRole().equalsIgnoreCase(userRole)) {
                                                logger.warn("Access denied for path: {}. Required role: {}, User role: {}",
                                                                path, config.getRequiredRole(), userRole);
                                                return buildErrorResponse(exchange, "Insufficient permissions",
                                                                HttpStatus.FORBIDDEN, path, "INSUFFICIENT_PERMISSIONS");
                                        }
                                }

                                // extract user info safely with null checks
                                Long userId = claims.get("id", Long.class);
                                String userEmail = claims.getSubject();
                                String userRole = claims.get("role", String.class);

                                // add user info to headers for downstream services
                                ServerHttpRequest modifiedRequest = request.mutate()
                                                .header("X-User-Id", userId != null ? String.valueOf(userId) : "")
                                                .header("X-User-Email", userEmail != null ? userEmail : "")
                                                .header("X-User-Role", userRole != null ? userRole : "")
                                                .build();

                                return chain.filter(exchange.mutate().request(modifiedRequest).build());

                        } catch (ExpiredJwtException e) {
                                logger.warn("JWT token expired for path: {}", path);
                                return buildErrorResponse(exchange, "Token has expired",
                                                HttpStatus.UNAUTHORIZED, path, "TOKEN_EXPIRED");
                        } catch (MalformedJwtException e) {
                                logger.warn("Malformed JWT token for path: {}", path);
                                return buildErrorResponse(exchange, "Malformed token",
                                                HttpStatus.UNAUTHORIZED, path, "MALFORMED_TOKEN");
                        } catch (UnsupportedJwtException e) {
                                logger.warn("Unsupported JWT token for path: {}", path);
                                return buildErrorResponse(exchange, "Unsupported token type",
                                                HttpStatus.UNAUTHORIZED, path, "UNSUPPORTED_TOKEN");
                        } catch (IllegalArgumentException e) {
                                logger.warn("Empty JWT claims for path: {}", path);
                                return buildErrorResponse(exchange, "Empty token claims",
                                                HttpStatus.UNAUTHORIZED, path, "EMPTY_CLAIMS");
                        } catch (JwtException e) {
                                logger.error("JWT validation failed for path: {}: {}", path, e.getMessage());
                                return buildErrorResponse(exchange, "Invalid token",
                                                HttpStatus.UNAUTHORIZED, path, "INVALID_TOKEN");
                        }
                };
        }

        /**
         * validate jwt token and extract claims in a single parse operation.
         *
         * @param token jwt token string
         * @return claims object containing all token claims
         * @throws jwtexception if token is invalid
         */
        private Claims validateAndExtractClaims(String token) {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                return Jwts.parser()
                                .verifyWith(key)
                                .build()
                                .parseSignedClaims(token)
                                .getPayload();
        }

        /**
         * build a structured json error response consistent with auth-service and
         * backend-monolith.
         *
         * @param exchange  server web exchange
         * @param message   human-readable error message
         * @param status    http status code
         * @param path      request path
         * @param errorcode machine-readable error code
         * @return mono<void> representing the error response
         **/
        private Mono<Void> buildErrorResponse(ServerWebExchange exchange, String message,
                        HttpStatus status, String path, String errorCode) {
                ServerHttpResponse response = exchange.getResponse();
                response.setStatusCode(status);
                response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

                String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMATTER);

                // structured json response matching auth-service/backend-monolith format
                String body = String.format(
                                "{\"success\":false,\"message\":\"%s\",\"path\":\"%s\",\"timestamp\":\"%s\",\"errorCode\":\"%s\"}",
                                escapeJsonString(message),
                                escapeJsonString(path),
                                timestamp,
                                errorCode);

                // note: CORS headers are handled by CorsWebFilter at highest precedence

                DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
                return response.writeWith(Mono.just(buffer));
        }

        // escape special characters in json string values.
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

        /**
         * configuration class for the jwt filter.
         * allows specifying required role for route access.
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
