package com.ocrs.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "updates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Update {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(name = "fir_id")
        private Long firId;

        @Column(name = "missing_person_id")
        private Long missingPersonId;

        @Column(name = "authority_id", nullable = false)
        private Long authorityId;

        @Enumerated(EnumType.STRING)
        @Column(name = "update_type", nullable = false)
        private UpdateType updateType;

        @Column(name = "previous_status")
        private String previousStatus;

        @Column(name = "new_status")
        private String newStatus;

        @Column(columnDefinition = "TEXT")
        private String comment;

        @Column(name = "created_at")
        private LocalDateTime createdAt;

        @PrePersist
        protected void onCreate() {
                createdAt = LocalDateTime.now();
        }

        public enum UpdateType {
                STATUS_CHANGE, COMMENT, EVIDENCE_ADDED, REASSIGNMENT
        }
}
