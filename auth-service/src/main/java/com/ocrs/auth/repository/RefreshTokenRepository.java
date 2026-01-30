package com.ocrs.auth.repository;

import com.ocrs.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

/**
 * Repository for refresh token operations.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

        Optional<RefreshToken> findByToken(String token);

        Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

        @Modifying
        @Query("DELETE FROM RefreshToken rt WHERE rt.userId = :userId AND rt.userRole = :userRole")
        void deleteByUserIdAndUserRole(@Param("userId") Long userId, @Param("userRole") String userRole);

        @Modifying
        @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.userId = :userId AND rt.userRole = :userRole")
        void revokeAllByUserIdAndRole(@Param("userId") Long userId, @Param("userRole") String userRole);

        @Modifying
        @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.token = :token")
        void revokeByToken(@Param("token") String token);

        @Modifying
        @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :now")
        void deleteExpiredTokens(@Param("now") Instant now);

        boolean existsByUserIdAndUserRoleAndRevokedFalse(Long userId, String userRole);
}
