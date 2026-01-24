package com.ocrs.backend.repository;

import com.ocrs.backend.entity.Update;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UpdateRepository extends JpaRepository<Update, Long> {

        List<Update> findByFirIdOrderByCreatedAtDesc(Long firId);

        List<Update> findByMissingPersonIdOrderByCreatedAtDesc(Long missingPersonId);

        List<Update> findByAuthorityIdOrderByCreatedAtDesc(Long authorityId);
}
