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
        private Long expiresIn; /**
         * Create an AuthResponse representing a successful authentication.
         *
         * @param token        the access token
         * @param refreshToken the refresh token used to obtain new access tokens; may be null
         * @param id           the authenticated user's identifier
         * @param email        the authenticated user's email address
         * @param fullName     the authenticated user's full name
         * @param role         the authenticated user's role
         * @param expiresIn    access token lifetime in seconds; may be null
         * @return             an AuthResponse populated with tokens, token type "Bearer", user information, expiration, and a success message
         */

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

        /**
         * Create an AuthResponse for a successful authentication using only an access token (backward-compatible overload).
         *
         * @param token the access token
         * @param id the authenticated user's identifier
         * @param email the authenticated user's email address
         * @param fullName the authenticated user's full name
         * @param role the authenticated user's role
         * @return an AuthResponse populated for a successful authentication; `refreshToken` and `expiresIn` will be `null`
         */
        public static AuthResponse success(String token, Long id, String email, String fullName, String role) {
                return success(token, null, id, email, fullName, role, null);
        }

        /**
         * Create an AuthResponse containing an error message.
         *
         * @param message the error message to include in the response
         * @return an AuthResponse with only the `message` field set
         */
        public static AuthResponse error(String message) {
                return AuthResponse.builder()
                                .message(message)
                                .build();
        }
}