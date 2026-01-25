package com.ocrs.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for exposing user details via internal API
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
