package com.ocrs.backend.repository;

import com.ocrs.backend.entity.FIR;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FIRRepository extends JpaRepository<FIR, Long> {

        List<FIR> findByUserId(Long userId);

        List<FIR> findByAuthorityId(Long authorityId);

        Optional<FIR> findByFirNumber(String firNumber);

        Page<FIR> findByAuthorityId(Long authorityId, Pageable pageable);

        Page<FIR> findByStatus(FIR.Status status, Pageable pageable);

        Page<FIR> findByCategory(FIR.Category category, Pageable pageable);

        @Query("SELECT COUNT(f) FROM FIR f WHERE f.status = :status")
        Long countByStatus(FIR.Status status);

        @Query("SELECT f.category, COUNT(f) FROM FIR f GROUP BY f.category")
        List<Object[]> countByCategory();

        @Query("SELECT f.status, COUNT(f) FROM FIR f GROUP BY f.status")
        List<Object[]> countGroupByStatus();

        Long countByAuthorityId(Long authorityId);

        /**
         * Count active (non-closed, non-resolved) FIRs for a given authority.
         * Used for load balancing in auto-assignment.
         */
        @Query("SELECT COUNT(f) FROM FIR f WHERE f.authorityId = :authorityId " +
                        "AND f.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')")
        long countActiveByAuthorityId(Long authorityId);

        Long countByAuthorityIdAndStatus(Long authorityId, FIR.Status status);

        @Query("SELECT f.status, COUNT(f) FROM FIR f WHERE f.authorityId = :authorityId GROUP BY f.status")
        List<Object[]> countGroupByStatusByAuthority(Long authorityId);

        @Query("SELECT f.authorityId, COUNT(f) FROM FIR f WHERE f.authorityId IS NOT NULL GROUP BY f.authorityId")
        List<Object[]> countGroupByOfficer();

        @Query("SELECT f FROM FIR f WHERE f.authorityId = :authorityId " +
                        "AND (:search IS NULL OR :search = '' OR LOWER(f.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(f.firNumber) LIKE LOWER(CONCAT('%', :search, '%'))) "
                        +
                        "AND (:category IS NULL OR f.category = :category) " +
                        "AND (:priority IS NULL OR f.priority = :priority) " +
                        "AND (:status IS NULL OR f.status = :status)")
        Page<FIR> searchByAuthority(Long authorityId, String search, FIR.Category category,
                        FIR.Priority priority, FIR.Status status, Pageable pageable);

        @Query(value = "SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) FROM firs WHERE status = 'RESOLVED'", nativeQuery = true)
        Double getAverageResolutionTimeInHours();

        long countByCreatedAtAfter(LocalDateTime date);
}
