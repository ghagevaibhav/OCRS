package com.ocrs.auth.exception;

/**
 * Exception thrown when refresh token validation fails.
 */
public class TokenRefreshException extends RuntimeException {

        private static final long serialVersionUID = 1L;

        private final String token;

        public TokenRefreshException(String token, String message) {
                super(message);
                this.token = token;
        }

        public String getToken() {
                return token;
        }
}
