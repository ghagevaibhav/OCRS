package com.ocrs.backend.repository;

import com.ocrs.backend.entity.MissingPerson;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MissingPersonRepository extends JpaRepository<MissingPerson, Long> {

        List<MissingPerson> findByUserId(Long userId);

        List<MissingPerson> findByAuthorityId(Long authorityId);

        Optional<MissingPerson> findByCaseNumber(String caseNumber);

        Page<MissingPerson> findByAuthorityId(Long authorityId, Pageable pageable);

        Page<MissingPerson> findByStatus(MissingPerson.MissingStatus status, Pageable pageable);

        @Query("SELECT COUNT(m) FROM MissingPerson m WHERE m.status = :status")
        Long countByStatus(MissingPerson.MissingStatus status);

        @Query("SELECT m.status, COUNT(m) FROM MissingPerson m GROUP BY m.status")
        List<Object[]> countGroupByStatus();

        Long countByAuthorityId(Long authorityId);

        /**
         * Count active (non-found, non-closed) reports for a given authority.
         * Used for load balancing in auto-assignment.
         */
        @Query("SELECT COUNT(m) FROM MissingPerson m WHERE m.authorityId = :authorityId " +
                        "AND m.status NOT IN ('FOUND', 'CLOSED')")
        long countActiveByAuthorityId(Long authorityId);

        Long countByAuthorityIdAndStatus(Long authorityId, MissingPerson.MissingStatus status);

        @Query("SELECT m.status, COUNT(m) FROM MissingPerson m WHERE m.authorityId = :authorityId GROUP BY m.status")
        List<Object[]> countGroupByStatusByAuthority(Long authorityId);

        @Query("SELECT m FROM MissingPerson m WHERE m.authorityId = :authorityId " +
                        "AND (:search IS NULL OR :search = '' OR LOWER(m.missingPersonName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.caseNumber) LIKE LOWER(CONCAT('%', :search, '%'))) "
                        +
                        "AND (:status IS NULL OR m.status = :status)")
        Page<MissingPerson> searchByAuthority(Long authorityId, String search, MissingPerson.MissingStatus status,
                        Pageable pageable);
}
