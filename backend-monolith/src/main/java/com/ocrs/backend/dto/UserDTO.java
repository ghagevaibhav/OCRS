package com.ocrs.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for receiving user details from Auth service via Feign
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
        private Long id;
        private String email;
        private String fullName;
        private String phone;
        private String address;
        private Boolean isActive;
}
