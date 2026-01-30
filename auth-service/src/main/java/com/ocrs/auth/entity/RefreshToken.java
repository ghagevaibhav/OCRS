package com.ocrs.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Entity representing a refresh token for JWT authentication.
 * Refresh tokens are stored in the database to enable token revocation.
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
                @Index(name = "idx_refresh_token", columnList = "token"),
                @Index(name = "idx_user_role", columnList = "userId, userRole")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false, unique = true, length = 500)
        private String token;

        @Column(nullable = false)
        private Long userId;

        @Column(nullable = false, length = 20)
        private String userRole; // USER, AUTHORITY, ADMIN

        @Column(nullable = false)
        private Instant expiryDate;

        @Builder.Default
        private boolean revoked = false;

        @Column(updatable = false)
        private Instant createdAt;

        @PrePersist
        protected void onCreate() {
                createdAt = Instant.now();
        }

        public boolean isExpired() {
                return Instant.now().isAfter(expiryDate);
        }
}
