package com.ocrs.auth.controller;

import com.ocrs.auth.dto.ApiResponse;
import com.ocrs.auth.dto.AuthorityDTO;
import com.ocrs.auth.dto.UserDTO;
import com.ocrs.auth.entity.Authority;
import com.ocrs.auth.entity.User;
import com.ocrs.auth.repository.AuthorityRepository;
import com.ocrs.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/*
 * Internal API Controller for service-to-service communication.
 * These endpoints are not meant for external clients but for
 * other microservices (backend-service) to fetch user/authority data.
*/

@RestController
@RequestMapping("/api/internal")
public class InternalAuthController {

        // logger for debugging purposes
        private static final Logger logger = LoggerFactory.getLogger(InternalAuthController.class);

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private AuthorityRepository authorityRepository;

        // get user details by id
        @GetMapping("/users/{id}")
        public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {
                logger.debug("Internal API: Fetching user with id: {}", id);

                return userRepository.findById(id)
                                .map(user -> {
                                        UserDTO dto = mapToUserDTO(user);
                                        return ResponseEntity.ok(ApiResponse.success("User found", dto));
                                })
                                .orElse(ResponseEntity.ok(ApiResponse.error("User not found")));
        }

        // get user details by email
        @GetMapping("/users/email/{email}")
        public ResponseEntity<ApiResponse<UserDTO>> getUserByEmail(@PathVariable String email) {
                logger.debug("Internal API: Fetching user with email: {}", email);

                return userRepository.findByEmail(email)
                                .map(user -> {
                                        UserDTO dto = mapToUserDTO(user);
                                        return ResponseEntity.ok(ApiResponse.success("User found", dto));
                                })
                                .orElse(ResponseEntity.ok(ApiResponse.error("User not found")));
        }

        // get authority details by id
        @GetMapping("/authorities/{id}")
        public ResponseEntity<ApiResponse<AuthorityDTO>> getAuthorityById(@PathVariable Long id) {
                logger.debug("Internal API: Fetching authority with id: {}", id);

                return authorityRepository.findById(id)
                                .map(authority -> {
                                        AuthorityDTO dto = mapToAuthorityDTO(authority);
                                        return ResponseEntity.ok(ApiResponse.success("Authority found", dto));
                                })
                                .orElse(ResponseEntity.ok(ApiResponse.error("Authority not found")));
        }

        // get all authorities -> for admin panel dropdown
        @GetMapping("/authorities")
        public ResponseEntity<ApiResponse<List<AuthorityDTO>>> getAllAuthorities() {
                logger.debug("Internal API: Fetching all authorities");

                List<AuthorityDTO> authorities = authorityRepository.findAll().stream()
                                .map(this::mapToAuthorityDTO)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(ApiResponse.success("Authorities retrieved", authorities));
        }

        // get all active authorities -> for admin panel manage authorities section
        @GetMapping("/authorities/active")
        public ResponseEntity<ApiResponse<List<AuthorityDTO>>> getActiveAuthorities() {
                logger.debug("Internal API: Fetching active authorities");

                List<AuthorityDTO> authorities = authorityRepository.findByIsActiveTrue().stream()
                                .map(this::mapToAuthorityDTO)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(ApiResponse.success("Active authorities retrieved", authorities));
        }

        // helper methods to map entities to DTOs
        private UserDTO mapToUserDTO(User user) {
                return UserDTO.builder()
                                .id(user.getId())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .phone(user.getPhone())
                                .address(user.getAddress())
                                .isActive(user.getIsActive())
                                .build();
        }

        private AuthorityDTO mapToAuthorityDTO(Authority authority) {
                return AuthorityDTO.builder()
                                .id(authority.getId())
                                .email(authority.getEmail())
                                .fullName(authority.getFullName())
                                .badgeNumber(authority.getBadgeNumber())
                                .designation(authority.getDesignation())
                                .stationName(authority.getStationName())
                                .stationAddress(authority.getStationAddress())
                                .phone(authority.getPhone())
                                .isActive(authority.getIsActive())
                                .build();
        }
}
