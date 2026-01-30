package com.ocrs.backend.controller;

import com.ocrs.backend.client.AuthServiceClient;
import com.ocrs.backend.dto.AnalyticsResponse;
import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.AuthorityDTO;
import com.ocrs.backend.entity.FIR;
import com.ocrs.backend.entity.MissingPerson;
import com.ocrs.backend.service.AnalyticsService;
import com.ocrs.backend.service.ExternalServiceClient;
import com.ocrs.backend.service.FIRService;
import com.ocrs.backend.service.MissingPersonService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Controller for managing FIRs, Missing Person reports, and viewing
 * authorities.
 * 
 * Security: All endpoints require ADMIN role - enforced at both:
 * - API Gateway level (route-based filtering)
 * - Method level (@PreAuthorize annotations for defense-in-depth)
 * 
 * Note: Authority creation/update/delete should be done via Auth Service
 * directly.
 * This controller only reads authority data via Feign for display purposes.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')") // Class-level security - all methods require ADMIN role
public class AdminController {

        private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

        @Autowired
        private FIRService firService;

        @Autowired
        private MissingPersonService missingPersonService;

        @Autowired
        private AnalyticsService analyticsService;

        @Autowired
        private AuthServiceClient authServiceClient;

        @Autowired
        private ExternalServiceClient externalServiceClient;

        // ==================== Analytics ====================

        /**
         * Get system-wide analytics including FIR and Missing Person statistics.
         */
        @GetMapping("/analytics")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<AnalyticsResponse> getAnalytics() {
                return ResponseEntity.ok(analyticsService.getAnalytics());
        }

        // ==================== FIR Management ====================

        /**
         * Get all FIRs in the system.
         * Admin-only endpoint for oversight and management.
         */
        @GetMapping("/firs")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<List<FIR>> getAllFIRs() {
                return ResponseEntity.ok(firService.getAllFIRs());
        }

        /**
         * Get a specific FIR by ID.
         */
        @GetMapping("/fir/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<FIR>> getFIR(@PathVariable Long id) {
                return ResponseEntity.ok(firService.getFIRById(id));
        }

        /**
         * Reassign a FIR to a different authority.
         * Used for workload balancing or when an authority is unavailable.
         */
        @PutMapping("/fir/{firId}/reassign/{authorityId}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<FIR>> reassignFIR(
                        @PathVariable Long firId,
                        @PathVariable Long authorityId) {
                ApiResponse<FIR> response = firService.reassignFIR(firId, authorityId);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        // ==================== Missing Person Management ====================

        /**
         * Get all Missing Person reports in the system.
         */
        @GetMapping("/missing-reports")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<List<MissingPerson>> getAllMissingReports() {
                return ResponseEntity.ok(missingPersonService.getAllReports());
        }

        /**
         * Get a specific Missing Person report by ID.
         */
        @GetMapping("/missing/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReport(@PathVariable Long id) {
                return ResponseEntity.ok(missingPersonService.getReportById(id));
        }

        /**
         * Reassign a Missing Person report to a different authority.
         */
        @PutMapping("/missing/{reportId}/reassign/{authorityId}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<MissingPerson>> reassignMissingReport(
                        @PathVariable Long reportId,
                        @PathVariable Long authorityId) {
                ApiResponse<MissingPerson> response = missingPersonService.reassignReport(reportId, authorityId);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        // ==================== Authority Management (Read-Only) ====================

        /**
         * Get all authorities from Auth Service via Feign.
         * Read-only operation - modifications should go through Auth Service directly.
         */
        @GetMapping("/authorities")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<List<AuthorityDTO>>> getAllAuthorities() {
                try {
                        ApiResponse<List<AuthorityDTO>> response = authServiceClient.getAllAuthorities();
                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        logger.error("Failed to fetch authorities from Auth service: {}", e.getMessage());
                        return ResponseEntity.ok(ApiResponse.error("Failed to fetch authorities"));
                }
        }

        /**
         * Get all active authorities from Auth Service.
         * Useful for assignment operations.
         */
        @GetMapping("/authorities/active")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<List<AuthorityDTO>>> getActiveAuthorities() {
                try {
                        ApiResponse<List<AuthorityDTO>> response = authServiceClient.getActiveAuthorities();
                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        logger.error("Failed to fetch active authorities from Auth service: {}", e.getMessage());
                        return ResponseEntity.ok(ApiResponse.error("Failed to fetch authorities"));
                }
        }

        /**
         * Get a specific authority by ID from Auth Service.
         */
        @GetMapping("/authority/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<AuthorityDTO>> getAuthority(@PathVariable Long id) {
                try {
                        ApiResponse<AuthorityDTO> response = authServiceClient.getAuthorityById(id);
                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        logger.error("Failed to fetch authority from Auth service: {}", e.getMessage());
                        return ResponseEntity.ok(ApiResponse.error("Failed to fetch authority"));
                }
        }

        // ==================== Deprecated Endpoints ====================

        /**
         * @deprecated Authority creation should be done via Auth Service directly.
         *             This endpoint is kept for backward compatibility but returns an
         *             error.
         */
        @PostMapping("/authority")
        @Deprecated
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<Void>> createAuthority(@RequestBody Object request) {
                return ResponseEntity.badRequest()
                                .body(ApiResponse.error(
                                                "Authority creation should be done via Auth Service at /api/auth/authority/register"));
        }

        /**
         * @deprecated Authority updates should be done via Auth Service directly.
         */
        @PutMapping("/authority/{id}")
        @Deprecated
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<Void>> updateAuthority(@PathVariable Long id, @RequestBody Object request) {
                return ResponseEntity.badRequest()
                                .body(ApiResponse.error("Authority updates should be done via Auth Service"));
        }

        /**
         * @deprecated Authority deletion should be done via Auth Service directly.
         */
        @DeleteMapping("/authority/{id}")
        @Deprecated
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<Void>> deleteAuthority(@PathVariable Long id) {
                return ResponseEntity.badRequest()
                                .body(ApiResponse.error("Authority deletion should be done via Auth Service"));
        }
}
