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
        private String token; // Access token
        private String refreshToken; // Refresh token for token renewal
        private String type;
        private Long id;
        private String email;
        private String fullName;
        private String role;
        private String message;
        private Long expiresIn; // Access token expiration in seconds

        public static AuthResponse success(String token, String refreshToken, Long id, String email,
                        String fullName, String role, Long expiresIn) {
                return AuthResponse.builder()
                                .token(token)
                                .refreshToken(refreshToken)
                                .type("Bearer")
                                .id(id)
                                .email(email)
                                .fullName(fullName)
                                .role(role)
                                .expiresIn(expiresIn)
                                .message("Authentication successful")
                                .build();
        }

        // Overloaded for backward compatibility (without refresh token)
        public static AuthResponse success(String token, Long id, String email, String fullName, String role) {
                return success(token, null, id, email, fullName, role, null);
        }

        public static AuthResponse error(String message) {
                return AuthResponse.builder()
                                .message(message)
                                .build();
        }
}
