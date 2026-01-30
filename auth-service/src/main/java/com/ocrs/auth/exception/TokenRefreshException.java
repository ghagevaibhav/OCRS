package com.ocrs.auth.exception;

/**
 * Exception thrown when refresh token validation fails.
 */
public class TokenRefreshException extends RuntimeException {

        private static final long serialVersionUID = 1L;

        private final String token;

        /**
         * Constructs an exception indicating a refresh token validation failure for the given token.
         *
         * @param token   the refresh token that failed validation
         * @param message a descriptive message explaining the failure
         */
        public TokenRefreshException(String token, String message) {
                super(message);
                this.token = token;
        }

        /**
         * Retrieves the refresh token associated with this exception.
         *
         * @return the token related to the refresh failure
         */
        public String getToken() {
                return token;
        }
}