package com.ocrs.auth.controller;

import com.ocrs.auth.dto.ApiResponse;
import com.ocrs.auth.entity.Authority;
import com.ocrs.auth.repository.AuthorityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authority Management Controller for CRUD operations.
 * Used by Admin frontend to manage authority accounts.
 */
@RestController
@RequestMapping("/api/authority")
public class AuthorityController {

        private static final Logger logger = LoggerFactory.getLogger(AuthorityController.class);

        @Autowired
        private AuthorityRepository authorityRepository;

        /**
         * Get authority by ID
         */
        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<Authority>> getAuthority(@PathVariable Long id) {
                return authorityRepository.findById(id)
                                .map(auth -> ResponseEntity.ok(ApiResponse.success("Authority found", auth)))
                                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("Authority not found")));
        }

        /**
         * Update authority details
         */
        @PutMapping("/{id}")
        public ResponseEntity<ApiResponse<Authority>> updateAuthority(
                        @PathVariable Long id,
                        @RequestBody Authority updatedAuth) {
                return authorityRepository.findById(id)
                                .map(auth -> {
                                        auth.setFullName(updatedAuth.getFullName());
                                        auth.setDesignation(updatedAuth.getDesignation());
                                        auth.setStationName(updatedAuth.getStationName());
                                        auth.setStationAddress(updatedAuth.getStationAddress());
                                        auth.setPhone(updatedAuth.getPhone());
                                        if (updatedAuth.getBadgeNumber() != null) {
                                                auth.setBadgeNumber(updatedAuth.getBadgeNumber());
                                        }
                                        Authority saved = authorityRepository.save(auth);
                                        logger.info("Authority {} updated", id);
                                        return ResponseEntity.ok(
                                                        ApiResponse.success("Authority updated successfully", saved));
                                })
                                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("Authority not found")));
        }

        /**
         * Delete (deactivate) authority
         */
        @DeleteMapping("/{id}")
        public ResponseEntity<ApiResponse<Void>> deleteAuthority(@PathVariable Long id) {
                return authorityRepository.findById(id)
                                .map(auth -> {
                                        auth.setIsActive(false);
                                        authorityRepository.save(auth);
                                        logger.info("Authority {} deactivated", id);
                                        return ResponseEntity.ok(ApiResponse
                                                        .<Void>success("Authority deactivated successfully", null));
                                })
                                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("Authority not found")));
        }
}
