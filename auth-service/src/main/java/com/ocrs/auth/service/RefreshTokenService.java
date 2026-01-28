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
         * Creates a new refresh token for a user.
         * Revokes any existing tokens for the same user/role combination.
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
         * Generates a cryptographically secure random token string.
         */
        private String generateTokenString() {
                return UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
        }

        /**
         * Finds a refresh token by its token string.
         */
        public Optional<RefreshToken> findByToken(String token) {
                return refreshTokenRepository.findByTokenAndRevokedFalse(token);
        }

        /**
         * Verifies that a refresh token is not expired.
         * 
         * @throws TokenRefreshException if the token is expired
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
         * Revokes all refresh tokens for a user with a specific role.
         */
        @Transactional
        public void revokeAllUserTokens(Long userId, String role) {
                refreshTokenRepository.revokeAllByUserIdAndRole(userId, role);
                logger.info("Revoked all refresh tokens for user {} with role {}", userId, role);
        }

        /**
         * Scheduled task to clean up expired tokens.
         * Runs every day at midnight.
         */
        @Scheduled(cron = "0 0 0 * * ?")
        @Transactional
        public void cleanupExpiredTokens() {
                refreshTokenRepository.deleteExpiredTokens(Instant.now());
                logger.info("Cleaned up expired refresh tokens");
        }
}
