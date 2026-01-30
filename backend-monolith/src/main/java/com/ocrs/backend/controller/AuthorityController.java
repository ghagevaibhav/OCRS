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
         * Retrieve analytics scoped to the authenticated authority.
         *
         * @param httpRequest the incoming HTTP request; must contain a "userId" attribute used to identify the authority
         * @return an AuthorityAnalyticsResponse with analytics for the authority identified by the request's "userId"
         */
        @GetMapping("/analytics")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<AuthorityAnalyticsResponse> getAnalytics(HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(analyticsService.getAuthorityAnalytics(authorityId));
        }

        // ==================== FIR Endpoints ====================

        /**
         * Retrieve all FIRs assigned to the authenticated authority.
         *
         * @param httpRequest HTTP request containing the authority's id as the "userId" request attribute.
         * @return a list of FIRs assigned to the authority.
         */
        @GetMapping("/firs")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<List<FIR>> getAssignedFIRs(HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(firService.getFIRsByAuthority(authorityId));
        }

        /**
         * Retrieve a paginated, sorted page of FIRs assigned to the authenticated authority.
         *
         * @param httpRequest HTTP request that must contain a "userId" attribute (Long) representing the authority's ID
         * @return a Page of FIR records assigned to the authority, using the requested page, size, and sort parameters
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
         * Retrieve a paginated list of FIRs assigned to the current authority, optionally filtered and searched.
         *
         * The authority is determined from the HttpServletRequest attribute "userId".
         *
         * @param httpRequest the HTTP request containing the current authority's "userId" attribute
         * @param search optional text to match against FIR fields
         * @param category optional FIR category to filter by
         * @param priority optional FIR priority to filter by
         * @param status optional FIR status to filter by
         * @param page zero-based page index
         * @param size page size (number of items per page)
         * @param sortBy field name to sort the results by
         * @param sortDir sort direction, either "asc" or "desc"
         * @return a Page of FIRs assigned to the authority that match the provided filters and search criteria
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
         * Retrieve the FIR with the given identifier.
         *
         * @param id the identifier of the FIR to retrieve
         * @return an ApiResponse containing the requested FIR on success or an error payload otherwise
         */
        @GetMapping("/fir/{id}")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<ApiResponse<FIR>> getFIR(@PathVariable Long id) {
                return ResponseEntity.ok(firService.getFIRById(id));
        }

        /**
         * Update a FIR's status and record an update note by the authority assigned to that FIR.
         *
         * @param firId      the ID of the FIR to update
         * @param request    contains the new status and an optional note describing the update
         * @param httpRequest used to obtain the authenticated authority's userId from the request attributes
         * @return           an ApiResponse containing the updated `FIR` on success, or error details when the update fails
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
         * Retrieve all status updates for the specified FIR.
         *
         * @param firId the identifier of the FIR
         * @return a list of Update objects representing the FIR's status history
         */
        @GetMapping("/fir/{firId}/updates")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<List<Update>> getFIRUpdates(@PathVariable Long firId) {
                return ResponseEntity.ok(firService.getFIRUpdates(firId));
        }

        // ==================== Missing Person Endpoints ====================

        /**
         * Retrieves all missing person reports assigned to the current authority.
         *
         * @param httpRequest the HTTP request containing the authenticated authority's ID in the "userId" attribute
         * @return a list of MissingPerson reports assigned to that authority
         */
        @GetMapping("/missing-reports")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<List<MissingPerson>> getAssignedMissingReports(HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(missingPersonService.getReportsByAuthority(authorityId));
        }

        /**
         * Retrieve a page of MissingPerson reports assigned to the authority identified by the incoming request.
         *
         * @param httpRequest HTTP request carrying the authenticated authority's ID in the `"userId"` attribute
         * @param page        zero-based page index (default 0)
         * @param size        page size (default 10)
         * @param sortBy      field name to sort by (default "createdAt")
         * @param sortDir     sort direction, either "asc" or "desc" (default "desc")
         * @return            a ResponseEntity containing a Page of MissingPerson reports assigned to the authority
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
         * Search and filter missing person reports assigned to the authenticated authority.
         *
         * @param httpRequest the incoming HTTP request; the authority's ID is read from the request attribute `"userId"`
         * @param search      optional free-text search applied to report fields
         * @param status      optional report status to filter by
         * @param page        zero-based page index (default 0)
         * @param size        page size (default 10)
         * @param sortBy      field to sort by (default "createdAt")
         * @param sortDir     sort direction, either "asc" or "desc" (default "desc")
         * @return            a page of MissingPerson reports assigned to the authority that match the provided filters
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
         * Retrieve the MissingPerson report identified by the given ID.
         *
         * @param id the ID of the missing person report to retrieve
         * @return an ApiResponse containing the requested MissingPerson if found, or an error payload otherwise
         */
        @GetMapping("/missing/{id}")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReport(@PathVariable Long id) {
                return ResponseEntity.ok(missingPersonService.getReportById(id));
        }

        /**
         * Update the status of a missing-person report and append an update note as the authority assigned to that report.
         *
         * @param reportId   the identifier of the missing-person report to update
         * @param request    an UpdateRequest containing the new status and an optional note to record with the update
         * @param httpRequest the HTTP request carrying a "userId" attribute identifying the authority performing the update
         * @return           an ApiResponse containing the updated MissingPerson when successful; the response's `isSuccess()`
         *                   indicates whether the update was applied
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
         * Retrieve status updates for a missing person report.
         *
         * @param reportId the identifier of the missing person report
         * @return a list of status updates associated with the specified report; an empty list if there are none
         */
        @GetMapping("/missing/{reportId}/updates")
        @PreAuthorize("hasRole('AUTHORITY')")
        public ResponseEntity<List<Update>> getMissingReportUpdates(@PathVariable Long reportId) {
                return ResponseEntity.ok(missingPersonService.getReportUpdates(reportId));
        }
}