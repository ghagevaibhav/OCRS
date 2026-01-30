package com.ocrs.backend.controller;

import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.FIRRequest;
import com.ocrs.backend.dto.MissingPersonRequest;
import com.ocrs.backend.entity.FIR;
import com.ocrs.backend.entity.MissingPerson;
import com.ocrs.backend.entity.Update;
import com.ocrs.backend.service.FIRService;
import com.ocrs.backend.service.MissingPersonService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for User-specific operations.
 * Handles FIR filing and Missing Person report management for authenticated
 * users.
 * 
 * All endpoints require USER role - enforced at both:
 * - API Gateway level (route-based filtering)
 * - Method level (@PreAuthorize annotations for defense-in-depth)
 */
@RestController
@RequestMapping("/api/user")
@PreAuthorize("hasRole('USER')") // Class-level security - all methods require USER role
public class UserController {

        @Autowired
        private FIRService firService;

        @Autowired
        private MissingPersonService missingPersonService;

        // ==================== FIR Endpoints ====================

        /**
         * File a new FIR (First Information Report) for the authenticated user.
         *
         * @param request     FIR details
         * @param httpRequest HTTP request containing the authenticated user's attributes
         * @return ApiResponse containing the created FIR on success, or an ApiResponse with error details on failure
         */
        @PostMapping("/fir")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<ApiResponse<FIR>> fileFIR(
                        @Valid @RequestBody FIRRequest request,
                        HttpServletRequest httpRequest) {
                Long userId = (Long) httpRequest.getAttribute("userId");
                ApiResponse<FIR> response = firService.fileFIR(userId, request);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        /**
         * Retrieves all FIRs filed by the current user.
         *
         * @param httpRequest the HTTP request whose "userId" attribute identifies the current user
         * @return the list of FIRs filed by the current user
         */
        @GetMapping("/firs")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<List<FIR>> getMyFIRs(HttpServletRequest httpRequest) {
                Long userId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(firService.getFIRsByUser(userId));
        }

        /**
         * Retrieve a FIR by its identifier.
         *
         * @param id the identifier of the FIR to retrieve
         * @return the ApiResponse containing the FIR with the given id
         */
        @GetMapping("/fir/{id}")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<ApiResponse<FIR>> getFIR(@PathVariable Long id) {
                return ResponseEntity.ok(firService.getFIRById(id));
        }

        /**
         * Retrieve the FIR that corresponds to the specified FIR number.
         *
         * @param firNumber the FIR number to look up
         * @return an ApiResponse containing the matching FIR or details about why it could not be returned
         */
        @GetMapping("/fir/number/{firNumber}")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<ApiResponse<FIR>> getFIRByNumber(@PathVariable String firNumber) {
                return ResponseEntity.ok(firService.getFIRByNumber(firNumber));
        }

        /**
         * Retrieves status updates for a specific FIR.
         *
         * @param firId the identifier of the FIR
         * @return a list of Update objects representing chronological status updates for the specified FIR
         */
        @GetMapping("/fir/{firId}/updates")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<List<Update>> getFIRUpdates(@PathVariable Long firId) {
                return ResponseEntity.ok(firService.getFIRUpdates(firId));
        }

        // ==================== Missing Person Endpoints ====================

        /**
         * Creates a new missing person report for the authenticated user.
         *
         * @param request     the missing person report payload
         * @param httpRequest the HTTP request from which the authenticated user's ID is read (attribute "userId")
         * @return the ApiResponse containing the created MissingPerson when successful, or an ApiResponse with error details otherwise
         */
        @PostMapping("/missing")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<ApiResponse<MissingPerson>> fileMissingReport(
                        @Valid @RequestBody MissingPersonRequest request,
                        HttpServletRequest httpRequest) {
                Long userId = (Long) httpRequest.getAttribute("userId");
                ApiResponse<MissingPerson> response = missingPersonService.fileReport(userId, request);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        /**
         * Retrieve all missing-person reports filed by the authenticated user.
         *
         * @param httpRequest the HTTP servlet request; must contain the authenticated user's ID in the "userId" attribute
         * @return a ResponseEntity containing the list of MissingPerson reports for the current user
         */
        @GetMapping("/missing-reports")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<List<MissingPerson>> getMyMissingReports(HttpServletRequest httpRequest) {
                Long userId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(missingPersonService.getReportsByUser(userId));
        }

        /**
         * Retrieve a missing person report by its identifier.
         *
         * @param id the identifier of the missing person report
         * @return an ApiResponse containing the MissingPerson when found, otherwise an ApiResponse with error details
         */
        @GetMapping("/missing/{id}")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReport(@PathVariable Long id) {
                return ResponseEntity.ok(missingPersonService.getReportById(id));
        }

        /**
         * Retrieve a missing person report identified by its case number.
         *
         * @param caseNumber the unique case number of the missing person report
         * @return the ApiResponse wrapping the MissingPerson report matching the provided case number
         */
        @GetMapping("/missing/number/{caseNumber}")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReportByNumber(@PathVariable String caseNumber) {
                return ResponseEntity.ok(missingPersonService.getReportByCaseNumber(caseNumber));
        }

        /**
         * Retrieves status updates for the specified missing person report.
         *
         * @param reportId the ID of the missing person report
         * @return a list of Update objects representing the report's status timeline
         */
        @GetMapping("/missing/{reportId}/updates")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<List<Update>> getMissingReportUpdates(@PathVariable Long reportId) {
                return ResponseEntity.ok(missingPersonService.getReportUpdates(reportId));
        }
}