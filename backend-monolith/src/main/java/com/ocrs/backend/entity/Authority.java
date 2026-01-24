package com.ocrs.backend.entity;

import jakarta.persistence.*;
import lombok.*;

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

        @Column(nullable = false, unique = true)
        private String email;

        @Column(nullable = false)
        private String password;

        @Column(name = "full_name", nullable = false)
        private String fullName;

        @Column(name = "badge_number", unique = true)
        private String badgeNumber;

        private String designation;

        @Column(name = "station_name")
        private String stationName;

        @Column(name = "station_address", columnDefinition = "TEXT")
        private String stationAddress;

        private String phone;

        @Column(name = "is_active")
        @Builder.Default
        private Boolean isActive = true;
}
