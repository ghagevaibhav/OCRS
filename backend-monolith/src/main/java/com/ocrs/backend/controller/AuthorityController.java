package com.ocrs.backend.controller;

import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.AuthorityAnalyticsResponse;
import com.ocrs.backend.dto.UpdateRequest;
import com.ocrs.backend.entity.FIR;
import com.ocrs.backend.entity.MissingPerson;
import com.ocrs.backend.entity.Update;
import com.ocrs.backend.service.AnalyticsService;
import com.ocrs.backend.service.FIRService;
import com.ocrs.backend.service.MissingPersonService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for Authority-specific operations.
 * Handles FIR and Missing Person case management for assigned authorities.
 * 
 * Security: All endpoints require AUTHORITY role - enforced at both:
 * - API Gateway level (route-based filtering)
 * - Method level (@PreAuthorize annotations for defense-in-depth)
 */
@RestController
@RequestMapping("/api/authority")
@PreAuthorize("hasRole('AUTHORITY')") // Class-level security - all methods require AUTHORITY role
public class AuthorityController {

        @Autowired
        private FIRService firService;

        @Autowired
        private MissingPersonService missingPersonService;

        @Autowired
        private AnalyticsService analyticsService;

        // ==================== Analytics ====================

        /**
         * Get analytics for the current authority's assigned cases.
         */
        @GetMapping("/analytics")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<AuthorityAnalyticsResponse> getAnalytics(HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(analyticsService.getAuthorityAnalytics(authorityId));
        }

        // ==================== FIR Endpoints ====================

        /**
         * Get all FIRs assigned to the current authority.
         */
        @GetMapping("/firs")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<List<FIR>> getAssignedFIRs(HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(firService.getFIRsByAuthority(authorityId));
        }

        /**
         * Get paginated list of FIRs assigned to the current authority.
         * Supports sorting by various fields.
         */
        @GetMapping("/firs/paged")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<Page<FIR>> getAssignedFIRsPaged(
                        HttpServletRequest httpRequest,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "createdAt") String sortBy,
                        @RequestParam(defaultValue = "desc") String sortDir) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending()
                                : Sort.by(sortBy).descending();
                Pageable pageable = PageRequest.of(page, size, sort);
                return ResponseEntity.ok(firService.getFIRsByAuthorityPaged(authorityId, pageable));
        }

        /**
         * Search and filter FIRs assigned to the current authority.
         * Supports filtering by category, priority, status, and text search.
         */
        @GetMapping("/firs/search")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<Page<FIR>> searchFIRs(
                        HttpServletRequest httpRequest,
                        @RequestParam(required = false) String search,
                        @RequestParam(required = false) FIR.Category category,
                        @RequestParam(required = false) FIR.Priority priority,
                        @RequestParam(required = false) FIR.Status status,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "createdAt") String sortBy,
                        @RequestParam(defaultValue = "desc") String sortDir) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending()
                                : Sort.by(sortBy).descending();
                Pageable pageable = PageRequest.of(page, size, sort);
                return ResponseEntity.ok(firService.searchFIRsByAuthority(authorityId, search, category, priority,
                                status, pageable));
        }

        /**
         * Get a specific FIR by ID.
         */
        @GetMapping("/fir/{id}")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<ApiResponse<FIR>> getFIR(@PathVariable Long id) {
                return ResponseEntity.ok(firService.getFIRById(id));
        }

        /**
         * Update the status of a FIR and add an update note.
         * Only the assigned authority can update a FIR.
         */
        @PutMapping("/fir/{firId}/update")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<ApiResponse<FIR>> updateFIRStatus(
                        @PathVariable Long firId,
                        @Valid @RequestBody UpdateRequest request,
                        HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                ApiResponse<FIR> response = firService.updateFIRStatus(firId, authorityId, request);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        /**
         * Get all status updates for a specific FIR.
         */
        @GetMapping("/fir/{firId}/updates")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<List<Update>> getFIRUpdates(@PathVariable Long firId) {
                return ResponseEntity.ok(firService.getFIRUpdates(firId));
        }

        // ==================== Missing Person Endpoints ====================

        /**
         * Get all Missing Person reports assigned to the current authority.
         */
        @GetMapping("/missing-reports")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<List<MissingPerson>> getAssignedMissingReports(HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(missingPersonService.getReportsByAuthority(authorityId));
        }

        /**
         * Get paginated list of Missing Person reports assigned to the current
         * authority.
         */
        @GetMapping("/missing-reports/paged")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<Page<MissingPerson>> getAssignedMissingReportsPaged(
                        HttpServletRequest httpRequest,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "createdAt") String sortBy,
                        @RequestParam(defaultValue = "desc") String sortDir) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending()
                                : Sort.by(sortBy).descending();
                Pageable pageable = PageRequest.of(page, size, sort);
                return ResponseEntity.ok(missingPersonService.getReportsByAuthorityPaged(authorityId, pageable));
        }

        /**
         * Search and filter Missing Person reports assigned to the current authority.
         */
        @GetMapping("/missing-reports/search")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<Page<MissingPerson>> searchMissingReports(
                        HttpServletRequest httpRequest,
                        @RequestParam(required = false) String search,
                        @RequestParam(required = false) MissingPerson.MissingStatus status,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "createdAt") String sortBy,
                        @RequestParam(defaultValue = "desc") String sortDir) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending()
                                : Sort.by(sortBy).descending();
                Pageable pageable = PageRequest.of(page, size, sort);
                return ResponseEntity.ok(
                                missingPersonService.searchReportsByAuthority(authorityId, search, status, pageable));
        }

        /**
         * Get a specific Missing Person report by ID.
         */
        @GetMapping("/missing/{id}")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReport(@PathVariable Long id) {
                return ResponseEntity.ok(missingPersonService.getReportById(id));
        }

        /**
         * Update the status of a Missing Person report and add an update note.
         * Only the assigned authority can update a report.
         */
        @PutMapping("/missing/{reportId}/update")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<ApiResponse<MissingPerson>> updateMissingReportStatus(
                        @PathVariable Long reportId,
                        @Valid @RequestBody UpdateRequest request,
                        HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                ApiResponse<MissingPerson> response = missingPersonService.updateReportStatus(reportId, authorityId,
                                request);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        /**
         * Get all status updates for a specific Missing Person report.
         */
        @GetMapping("/missing/{reportId}/updates")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<List<Update>> getMissingReportUpdates(@PathVariable Long reportId) {
                return ResponseEntity.ok(missingPersonService.getReportUpdates(reportId));
        }
}
