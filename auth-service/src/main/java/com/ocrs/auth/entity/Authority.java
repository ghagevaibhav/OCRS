package com.ocrs.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "authorities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Authority {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(name = "full_name", nullable = false)
        private String fullName;

        @Column(nullable = false, unique = true)
        private String email;

        @Column(nullable = false)
        private String password;

        @Column(name = "badge_number", unique = true)
        private String badgeNumber;

        private String designation;

        @Column(name = "station_name")
        private String stationName;

        @Column(name = "station_address", columnDefinition = "TEXT")
        private String stationAddress;

        private String phone;

        @Column(name = "created_at")
        private LocalDateTime createdAt;

        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

        @Column(name = "is_active")
        @Builder.Default
        private Boolean isActive = true;

        @PrePersist
        protected void onCreate() {
                createdAt = LocalDateTime.now();
                updatedAt = LocalDateTime.now();
        }

        @PreUpdate
        protected void onUpdate() {
                updatedAt = LocalDateTime.now();
        }
}
