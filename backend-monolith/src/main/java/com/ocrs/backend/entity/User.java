package com.ocrs.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

        public enum Role {
                USER,
                AUTHORITY,
                ADMIN
        }

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false, unique = true)
        private String email;

        @Column(nullable = false)
        private String password;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private Role role;

        @Column(name = "full_name", nullable = false)
        private String fullName;

        private String phone;

        @Column(columnDefinition = "TEXT")
        private String address;

        @Column(name = "aadhaar_number", unique = true, length = 12)
        private String aadhaarNumber;

        @Column(name = "is_active")
        @Builder.Default
        private Boolean isActive = true;
}
