package com.ocrs.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "firs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FIR {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(name = "fir_number", nullable = false, unique = true)
        private String firNumber;

        @Column(name = "user_id", nullable = false)
        private Long userId;

        @Column(name = "authority_id")
        private Long authorityId;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private Category category;

        @Column(nullable = false)
        private String title;

        @Column(nullable = false, columnDefinition = "TEXT")
        private String description;

        @Column(name = "incident_date", nullable = false)
        private LocalDate incidentDate;

        @Column(name = "incident_time")
        private LocalTime incidentTime;

        @Column(name = "incident_location", nullable = false, columnDefinition = "TEXT")
        private String incidentLocation;

        @Enumerated(EnumType.STRING)
        @Builder.Default
        private Status status = Status.PENDING;

        @Enumerated(EnumType.STRING)
        @Builder.Default
        private Priority priority = Priority.MEDIUM;

        @Column(name = "evidence_urls", columnDefinition = "JSON")
        private String evidenceUrls;

        @Column(name = "created_at")
        private LocalDateTime createdAt;

        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

        @PrePersist
        protected void onCreate() {
                createdAt = LocalDateTime.now();
                updatedAt = LocalDateTime.now();
        }

        @PreUpdate
        protected void onUpdate() {
                updatedAt = LocalDateTime.now();
        }

        public enum Category {
                THEFT, ASSAULT, FRAUD, CYBERCRIME, HARASSMENT, VANDALISM, OTHER
        }

        public enum Status {
                PENDING, UNDER_INVESTIGATION, RESOLVED, CLOSED, REJECTED
        }

        public enum Priority {
                LOW, MEDIUM, HIGH, URGENT
        }
}
