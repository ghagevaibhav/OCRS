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

        /**
 * Retrieves the refresh token entity matching the given token value.
 *
 * @param token the refresh token string to search for
 * @return an Optional containing the matching RefreshToken if present, otherwise an empty Optional
 */
Optional<RefreshToken> findByToken(String token);

        /**
 * Finds a refresh token entity by its token value only if it is not revoked.
 *
 * @param token the token string to look up
 * @return an {@link Optional} containing the matching {@link RefreshToken} if found and not revoked, {@link Optional#empty()} otherwise
 */
Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

        /**
         * Delete all refresh tokens belonging to the specified user and role.
         *
         * @param userId   the identifier of the user whose refresh tokens will be deleted
         * @param userRole the role associated with the refresh tokens to delete
         */
        @Modifying
        @Query("DELETE FROM RefreshToken rt WHERE rt.userId = :userId AND rt.userRole = :userRole")
        void deleteByUserIdAndUserRole(@Param("userId") Long userId, @Param("userRole") String userRole);

        /**
         * Marks all refresh tokens belonging to the specified user and role as revoked.
         *
         * @param userId   the id of the user whose tokens will be revoked
         * @param userRole the role associated with the tokens to revoke
         */
        @Modifying
        @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.userId = :userId AND rt.userRole = :userRole")
        void revokeAllByUserIdAndRole(@Param("userId") Long userId, @Param("userRole") String userRole);

        /**
         * Marks the refresh token identified by the given token string as revoked.
         *
         * @param token the token string of the RefreshToken to revoke
         */
        @Modifying
        @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.token = :token")
        void revokeByToken(@Param("token") String token);

        /**
         * Delete all refresh tokens whose expiry date is earlier than the provided timestamp.
         *
         * @param now the cutoff instant; tokens with expiryDate before this instant will be removed
         */
        @Modifying
        @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :now")
        void deleteExpiredTokens(@Param("now") Instant now);

        /**
 * Checks whether a non-revoked refresh token exists for the specified user and role.
 *
 * @param userId   the database identifier of the user
 * @param userRole the role associated with the user's refresh token
 * @return `true` if a non-revoked refresh token exists for the given user and role, `false` otherwise
 */
boolean existsByUserIdAndUserRoleAndRevokedFalse(Long userId, String userRole);
}