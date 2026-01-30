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
         * Retrieves system-wide analytics including FIR and Missing Person statistics.
         *
         * @return an AnalyticsResponse containing aggregated FIR and Missing Person statistics and other system-wide analytics
         */
        @GetMapping("/analytics")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<AnalyticsResponse> getAnalytics() {
                return ResponseEntity.ok(analyticsService.getAnalytics());
        }

        // ==================== FIR Management ====================

        /**
         * Retrieve all FIRs in the system for administrative oversight.
         *
         * @return a ResponseEntity containing the list of all FIRs and an HTTP 200 status
         */
        @GetMapping("/firs")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<List<FIR>> getAllFIRs() {
                return ResponseEntity.ok(firService.getAllFIRs());
        }

        /**
         * Retrieve a FIR by its identifier.
         *
         * @param id the identifier of the FIR to retrieve
         * @return an ApiResponse wrapping the requested FIR or an error payload if retrieval failed
         */
        @GetMapping("/fir/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<FIR>> getFIR(@PathVariable Long id) {
                return ResponseEntity.ok(firService.getFIRById(id));
        }

        /**
         * Reassigns a FIR to a different authority.
         *
         * <p>Used by administrators to change which authority is responsible for the specified FIR.
         *
         * @param firId the identifier of the FIR to reassign
         * @param authorityId the identifier of the authority that will take responsibility for the FIR
         * @return an ApiResponse containing the updated FIR on success, or an ApiResponse with error details on failure
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
         * Retrieve all missing person reports in the system.
         *
         * @return a ResponseEntity containing a list of all MissingPerson reports
         */
        @GetMapping("/missing-reports")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<List<MissingPerson>> getAllMissingReports() {
                return ResponseEntity.ok(missingPersonService.getAllReports());
        }

        /**
         * Retrieves the MissingPerson report with the given ID.
         *
         * @param id the ID of the missing person report to retrieve
         * @return an ApiResponse containing the requested MissingPerson, or an error response
         */
        @GetMapping("/missing/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReport(@PathVariable Long id) {
                return ResponseEntity.ok(missingPersonService.getReportById(id));
        }

        /**
         * Reassigns a missing person report to another authority.
         *
         * @param reportId    the ID of the missing person report to reassign
         * @param authorityId the ID of the authority to assign the report to
         * @return an ApiResponse containing the updated MissingPerson when the reassignment succeeds; on failure the response contains error details
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
         * Fetches all authorities from the authentication service.
         *
         * Read-only operation; authority creation, update, and deletion must be performed via the Auth Service.
         *
         * @return an ApiResponse containing the list of AuthorityDTO objects, or an error ApiResponse if the fetch fails
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
         * Retrieve the list of active authorities from the Auth Service.
         *
         * If the Auth Service call fails, returns an error ApiResponse with the message "Failed to fetch authorities".
         *
         * @return an ApiResponse containing the list of active AuthorityDTO on success; an error ApiResponse with message "Failed to fetch authorities" on failure
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
         * Retrieve an authority by its ID from the Auth Service.
         *
         * @param id the authority's ID
         * @return an ApiResponse containing the AuthorityDTO when successful; an error ApiResponse with message "Failed to fetch authority" otherwise
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
         * Deprecated endpoint that rejects authority creation and directs clients to the Auth Service.
         *
         * @deprecated Authority creation must be performed via the Auth Service (POST /api/auth/authority/register); this endpoint is retained only for backward compatibility and always returns an error.
         * @param request the request body (ignored; retained for compatibility)
         * @return a ResponseEntity containing an ApiResponse with an error message instructing clients to use the Auth Service
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
         * Rejects authority update requests and directs callers to use the Auth Service.
         *
         * This endpoint is deprecated and does not perform any update. It exists only to
         * return a standardized error response advising administrators to call the
         * appropriate Auth Service endpoint for authority modifications.
         *
         * @param id      identifier of the authority to update
         * @param request request payload for the update (ignored)
         * @return        a ResponseEntity containing an error ApiResponse with guidance to use the Auth Service; HTTP 400
         * @deprecated Use the Auth Service's authority update endpoints instead of this controller.
         */
        @PutMapping("/authority/{id}")
        @Deprecated
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<Void>> updateAuthority(@PathVariable Long id, @RequestBody Object request) {
                return ResponseEntity.badRequest()
                                .body(ApiResponse.error("Authority updates should be done via Auth Service"));
        }

        /**
         * Rejects requests to delete an authority and instructs clients to use the Auth Service.
         *
         * @param id the identifier of the authority to delete
         * @return a ResponseEntity containing an ApiResponse with an error message directing the client to use the Auth Service
         * @deprecated Authority deletion is managed by the Auth Service; call the Auth Service endpoint to remove authorities.
         */
        @DeleteMapping("/authority/{id}")
        @Deprecated
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<Void>> deleteAuthority(@PathVariable Long id) {
                return ResponseEntity.badRequest()
                                .body(ApiResponse.error("Authority deletion should be done via Auth Service"));
        }
}