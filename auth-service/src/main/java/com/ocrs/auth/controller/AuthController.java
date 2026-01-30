package com.ocrs.auth.controller;

import com.ocrs.auth.dto.*;
import com.ocrs.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

        @Autowired
        private AuthService authService;

        @PostMapping("/register/user")
        public ResponseEntity<ApiResponse<AuthResponse>> registerUser(
                        @Valid @RequestBody UserRegisterRequest request) {
                ApiResponse<AuthResponse> response = authService.registerUser(request);
                if (response.isSuccess()) {
                        return ResponseEntity.ok(response);
                }
                return ResponseEntity.badRequest().body(response);
        }

        @PostMapping("/register/authority")
        public ResponseEntity<ApiResponse<AuthResponse>> registerAuthority(
                        @Valid @RequestBody AuthorityRegisterRequest request) {
                ApiResponse<AuthResponse> response = authService.registerAuthority(request);
                if (response.isSuccess()) {
                        return ResponseEntity.ok(response);
                }
                return ResponseEntity.badRequest().body(response);
        }

        /**
         * Authenticate the provided credentials and return an authentication result.
         *
         * @param request the login credentials (e.g., username/email and password)
         * @return the ApiResponse containing an AuthResponse on success or error details on failure
         */
        @PostMapping("/login")
        public ResponseEntity<ApiResponse<AuthResponse>> login(
                        @Valid @RequestBody LoginRequest request) {
                ApiResponse<AuthResponse> response = authService.login(request);
                if (response.isSuccess()) {
                        return ResponseEntity.ok(response);
                }
                return ResponseEntity.badRequest().body(response);
        }

        /**
         * Refreshes the access token using the provided refresh token.
         *
         * @param request a request object containing the refresh token to exchange for a new access token
         * @return an {@code ApiResponse<AuthResponse>} containing the refreshed access token and, optionally, a new refresh token; {@code success} is `true` with token data on success and `false` with error details on failure
         */
        @PostMapping("/refresh")
        public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
                        @Valid @RequestBody RefreshTokenRequest request) {
                ApiResponse<AuthResponse> response = authService.refreshToken(request.getRefreshToken());
                if (response.isSuccess()) {
                        return ResponseEntity.ok(response);
                }
                return ResponseEntity.status(401).body(response);
        }

        /**
         * Revoke a refresh token to make it invalid for future use.
         *
         * @param request the refresh token request containing the token to revoke
         * @return an ApiResponse containing `true` if the token was successfully revoked, `false` otherwise
         */
        @PostMapping("/revoke")
        public ResponseEntity<ApiResponse<Boolean>> revokeToken(
                        @Valid @RequestBody RefreshTokenRequest request) {
                ApiResponse<Boolean> response = authService.revokeRefreshToken(request.getRefreshToken());
                return ResponseEntity.ok(response);
        }

        /**
         * Logs a user's logout and revokes any associated refresh tokens.
         *
         * @param userId the identifier of the user to log out
         * @param role   the role of the user (for example, "USER" or "AUTHORITY")
         * @return       an ApiResponse containing `true` if the logout and revocation succeeded, `false` otherwise
         */
        @PostMapping("/logout")
        public ResponseEntity<ApiResponse<Boolean>> logout(
                        @RequestParam Long userId,
                        @RequestParam String role) {
                ApiResponse<Boolean> response = authService.logout(userId, role);
                return ResponseEntity.ok(response);
        }

        @GetMapping("/validate")
        public ResponseEntity<ApiResponse<Boolean>> validateToken(
                        @RequestHeader("Authorization") String authHeader) {
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        ApiResponse<Boolean> response = authService.validateToken(token);
                        if (response.isSuccess()) {
                                return ResponseEntity.ok(response);
                        }
                        return ResponseEntity.badRequest().body(response);
                }
                return ResponseEntity.badRequest().body(ApiResponse.error("No token provided"));
        }

        @GetMapping("/health")
        public ResponseEntity<String> health() {
                return ResponseEntity.ok("Auth Service is running");
        }
}