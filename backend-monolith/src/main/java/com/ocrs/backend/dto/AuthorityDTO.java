package com.ocrs.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for receiving authority details from Auth service via Feign
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorityDTO {
        private Long id;
        private String email;
        private String fullName;
        private String badgeNumber;
        private String designation;
        private String stationName;
        private String stationAddress;
        private String phone;
        private Boolean isActive;
}
