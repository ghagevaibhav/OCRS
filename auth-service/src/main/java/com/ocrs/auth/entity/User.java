package com.ocrs.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(name = "full_name", nullable = false)
        private String fullName;

        @Column(nullable = false, unique = true)
        private String email;

        @Column(nullable = false)
        private String password;

        private String phone;

        @Column(columnDefinition = "TEXT")
        private String address;

        @Column(name = "aadhaar_number", unique = true, length = 12)
        private String aadhaarNumber;

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
