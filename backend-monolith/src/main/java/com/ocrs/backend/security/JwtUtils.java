package com.ocrs.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtUtils {

        private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

        @Value("${jwt.secret}")
        private String jwtSecret;

        /**
         * Builds a SecretKey for HMAC-SHA signing from the configured JWT secret.
         *
         * @return the SecretKey derived from the `jwtSecret` string (UTF-8 bytes)
         */
        private SecretKey getSigningKey() {
                byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
                return Keys.hmacShaKeyFor(keyBytes);
        }

        /**
         * Record to hold all JWT claims - parsed once for efficiency.
         */
        public record JwtClaims(Long id, String email, String role) {
        }

        /**
         * Extracts the JWT's id, subject (email), and role in a single parse operation.
         *
         * @param token the JWT string to parse
         * @return a JwtClaims containing the token's id, email (subject), and role
         */
        public JwtClaims extractAllClaims(String token) {
                Claims claims = Jwts.parser()
                                .verifyWith(getSigningKey())
                                .build()
                                .parseSignedClaims(token)
                                .getPayload();

                return new JwtClaims(
                                claims.get("id", Long.class),
                                claims.getSubject(),
                                claims.get("role", String.class));
        }

        /**
         * Extracts the email stored as the JWT subject.
         *
         * @param token the compact JWT string to parse
         * @return the subject claim (email) contained in the token
         */
        public String getEmailFromToken(String token) {
                return Jwts.parser()
                                .verifyWith(getSigningKey())
                                .build()
                                .parseSignedClaims(token)
                                .getPayload()
                                .getSubject();
        }

        public Long getIdFromToken(String token) {
                return Jwts.parser()
                                .verifyWith(getSigningKey())
                                .build()
                                .parseSignedClaims(token)
                                .getPayload()
                                .get("id", Long.class);
        }

        public String getRoleFromToken(String token) {
                return Jwts.parser()
                                .verifyWith(getSigningKey())
                                .build()
                                .parseSignedClaims(token)
                                .getPayload()
                                .get("role", String.class);
        }

        public boolean validateToken(String token) {
                try {
                        Jwts.parser()
                                        .verifyWith(getSigningKey())
                                        .build()
                                        .parseSignedClaims(token);
                        return true;
                } catch (MalformedJwtException e) {
                        logger.error("Invalid JWT token: {}", e.getMessage());
                } catch (ExpiredJwtException e) {
                        logger.error("JWT token is expired: {}", e.getMessage());
                } catch (UnsupportedJwtException e) {
                        logger.error("JWT token is unsupported: {}", e.getMessage());
                } catch (IllegalArgumentException e) {
                        logger.error("JWT claims string is empty: {}", e.getMessage());
                }
                return false;
        }
}