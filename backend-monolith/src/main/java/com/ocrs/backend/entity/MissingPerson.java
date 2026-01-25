package com.ocrs.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "missing_persons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MissingPerson {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(name = "case_number", nullable = false, unique = true)
        private String caseNumber;

        @Column(name = "user_id", nullable = false)
        private Long userId;

        @Column(name = "authority_id")
        private Long authorityId;

        @Column(name = "missing_person_name", nullable = false)
        private String missingPersonName;

        private Integer age;

        @Enumerated(EnumType.STRING)
        private Gender gender;

        private String height;

        private String weight;

        private String complexion;

        @Column(name = "identifying_marks", columnDefinition = "TEXT")
        private String identifyingMarks;

        @Column(name = "last_seen_date", nullable = false)
        private LocalDate lastSeenDate;

        @Column(name = "last_seen_location", nullable = false, columnDefinition = "TEXT")
        private String lastSeenLocation;

        @Column(columnDefinition = "TEXT")
        private String description;

        @Column(name = "photo_url")
        private String photoUrl;

        @Enumerated(EnumType.STRING)
        @Builder.Default
        private MissingStatus status = MissingStatus.MISSING;

        @Column(name = "contact_phone")
        private String contactPhone;

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

        public enum Gender {
                MALE, FEMALE, OTHER
        }

        public enum MissingStatus {
                PENDING, SEARCHING, MISSING, FOUND, CLOSED
        }
}
