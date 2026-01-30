package com.ocrs.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

        private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

        @Value("${jwt.secret}")
        private String jwtSecret;

        @Value("${jwt.expiration}")
        private long jwtExpiration;

        /**
         * Record to hold all JWT claims - parsed once for efficiency.
         */
        public record JwtClaims(Long id, String email, String role) {
        }

        /**
         * Builds an HMAC SHA SecretKey from the configured JWT secret.
         *
         * @return the SecretKey derived from the UTF-8 bytes of `jwtSecret`, suitable for HMAC SHA signing/verification
         */
        private SecretKey getSigningKey() {
                byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
                return Keys.hmacShaKeyFor(keyBytes);
        }

        /**
         * Create a signed JWT containing the given user's id, email, and role.
         *
         * @param id    the user's identifier to include as the `id` claim
         * @param email the user's email to set as the token subject
         * @param role  the user's role to include as the `role` claim
         * @return      a compact JWT string signed with the configured secret and expiring after the configured duration
         */
        public String generateToken(Long id, String email, String role) {
                return Jwts.builder()
                                .subject(email)
                                .claim("id", id)
                                .claim("role", role)
                                .issuedAt(new Date())
                                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                                .signWith(getSigningKey())
                                .compact();
        }

        /**
         * Parse the JWT and return its id, email (subject), and role in a single operation.
         *
         * @param token the JWT string to parse and verify
         * @return a {@code JwtClaims} record containing the token's id, email (subject), and role
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
         * Extracts the email address stored as the JWT subject from the provided token.
         *
         * @param token the JWT string to parse and verify
         * @return the email from the token's subject claim
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