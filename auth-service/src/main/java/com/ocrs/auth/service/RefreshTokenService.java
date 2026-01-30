package com.ocrs.auth.service;

import com.ocrs.auth.entity.RefreshToken;
import com.ocrs.auth.exception.TokenRefreshException;
import com.ocrs.auth.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing refresh tokens.
 * Handles creation, validation, and revocation of refresh tokens.
 */
@Service
public class RefreshTokenService {

        private static final Logger logger = LoggerFactory.getLogger(RefreshTokenService.class);

        @Value("${jwt.refresh-token-expiration:604800000}") // 7 days default
        private long refreshTokenDurationMs;

        @Autowired
        private RefreshTokenRepository refreshTokenRepository;

        /**
         * Create a new refresh token for the given user and role, revoking any existing tokens for that user-role.
         *
         * @param userId the ID of the user the refresh token will be associated with
         * @param role the role to embed with the refresh token
         * @return the persisted RefreshToken entity
         */
        @Transactional
        public RefreshToken createRefreshToken(Long userId, String role) {
                // Revoke any existing tokens for this user/role
                refreshTokenRepository.revokeAllByUserIdAndRole(userId, role);

                RefreshToken refreshToken = RefreshToken.builder()
                                .userId(userId)
                                .userRole(role)
                                .token(generateTokenString())
                                .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs))
                                .revoked(false)
                                .build();

                refreshToken = refreshTokenRepository.save(refreshToken);
                logger.info("Created refresh token for user {} with role {}", userId, role);
                return refreshToken;
        }

        /**
         * Create a random token string composed of two UUIDs separated by a dash.
         *
         * @return the generated token string (two UUIDs joined by '-')
         */
        private String generateTokenString() {
                return UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
        }

        /**
         * Locate a non-revoked refresh token by its token string.
         *
         * @param token the refresh token string to search for
         * @return an Optional containing the matching non-revoked RefreshToken if found, or empty otherwise
         */
        public Optional<RefreshToken> findByToken(String token) {
                return refreshTokenRepository.findByTokenAndRevokedFalse(token);
        }

        /**
         * Validate a refresh token's expiration and revocation status.
         *
         * If the token is expired it will be revoked and a TokenRefreshException is thrown.
         *
         * @param token the refresh token to validate
         * @return the same {@code token} when it is valid
         * @throws TokenRefreshException if the token is expired or has been revoked
         */
        public RefreshToken verifyExpiration(RefreshToken token) {
                if (token.isExpired()) {
                        refreshTokenRepository.revokeByToken(token.getToken());
                        throw new TokenRefreshException(token.getToken(),
                                        "Refresh token has expired. Please login again.");
                }

                if (token.isRevoked()) {
                        throw new TokenRefreshException(token.getToken(),
                                        "Refresh token has been revoked. Please login again.");
                }

                return token;
        }

        /**
         * Revokes a specific refresh token.
         */
        @Transactional
        public void revokeToken(String token) {
                refreshTokenRepository.revokeByToken(token);
                logger.info("Revoked refresh token");
        }

        /**
         * Revoke all refresh tokens associated with the given user and role.
         *
         * @param userId the identifier of the user whose tokens will be revoked
         * @param role the user role for which tokens will be revoked
         */
        @Transactional
        public void revokeAllUserTokens(Long userId, String role) {
                refreshTokenRepository.revokeAllByUserIdAndRole(userId, role);
                logger.info("Revoked all refresh tokens for user {} with role {}", userId, role);
        }

        /**
         * Deletes expired refresh tokens from the repository.
         *
         * Scheduled to run daily at midnight; removes tokens with an expiry before the current instant.
         */
        @Scheduled(cron = "0 0 0 * * ?")
        @Transactional
        public void cleanupExpiredTokens() {
                refreshTokenRepository.deleteExpiredTokens(Instant.now());
                logger.info("Cleaned up expired refresh tokens");
        }
}