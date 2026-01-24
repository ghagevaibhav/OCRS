package com.ocrs.auth.repository;

import com.ocrs.auth.entity.Authority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuthorityRepository extends JpaRepository<Authority, Long> {

        Optional<Authority> findByEmail(String email);

        boolean existsByEmail(String email);

        boolean existsByBadgeNumber(String badgeNumber);

        List<Authority> findByIsActiveTrue();
}
