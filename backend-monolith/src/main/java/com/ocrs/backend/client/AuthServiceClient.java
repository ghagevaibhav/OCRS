package com.ocrs.backend.client;

import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.AuthorityDTO;
import com.ocrs.backend.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Feign client for communicating with Auth Service.
 * Uses Eureka service discovery to find auth-service instances.
 * Falls back to AuthServiceFallback when auth-service is unavailable.
 */

@FeignClient(name = "auth-service", fallbackFactory = AuthServiceFallbackFactory.class)
public interface AuthServiceClient {

        // Get user details by ID
        @GetMapping("/api/internal/users/{id}")
        ApiResponse<UserDTO> getUserById(@PathVariable("id") Long id);

        // Get user details by email
        @GetMapping("/api/internal/users/email/{email}")
        ApiResponse<UserDTO> getUserByEmail(@PathVariable("email") String email);

        // Get authority details by ID
        @GetMapping("/api/internal/authorities/{id}")
        ApiResponse<AuthorityDTO> getAuthorityById(@PathVariable("id") Long id);

        // Get all authorities
        @GetMapping("/api/internal/authorities")
        ApiResponse<List<AuthorityDTO>> getAllAuthorities();

        // Get all active authorities
        @GetMapping("/api/internal/authorities/active")
        ApiResponse<List<AuthorityDTO>> getActiveAuthorities();
}
