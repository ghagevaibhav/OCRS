package com.ocrs.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
        private String token;
        private String type;
        private Long id;
        private String email;
        private String fullName;
        private String role;
        private String message;

        public static AuthResponse success(String token, Long id, String email, String fullName, String role) {
                return AuthResponse.builder()
                                .token(token)
                                .type("Bearer")
                                .id(id)
                                .email(email)
                                .fullName(fullName)
                                .role(role)
                                .message("Authentication successful")
                                .build();
        }

        public static AuthResponse error(String message) {
                return AuthResponse.builder()
                                .message(message)
                                .build();
        }
}
