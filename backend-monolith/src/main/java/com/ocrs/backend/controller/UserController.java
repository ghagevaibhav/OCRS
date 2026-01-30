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
         * File a new FIR (First Information Report).
         * 
         * @param request     FIR details
         * @param httpRequest HTTP request containing user identity
         * @return Created FIR with success/error response
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
         * Get all FIRs filed by the current user.
         */
        @GetMapping("/firs")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<List<FIR>> getMyFIRs(HttpServletRequest httpRequest) {
                Long userId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(firService.getFIRsByUser(userId));
        }

        /**
         * Get a specific FIR by ID.
         * Note: Consider adding ownership validation for production systems.
         */
        @GetMapping("/fir/{id}")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<ApiResponse<FIR>> getFIR(@PathVariable Long id) {
                return ResponseEntity.ok(firService.getFIRById(id));
        }

        /**
         * Get a specific FIR by FIR number.
         */
        @GetMapping("/fir/number/{firNumber}")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<ApiResponse<FIR>> getFIRByNumber(@PathVariable String firNumber) {
                return ResponseEntity.ok(firService.getFIRByNumber(firNumber));
        }

        /**
         * Get status updates for a specific FIR.
         */
        @GetMapping("/fir/{firId}/updates")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<List<Update>> getFIRUpdates(@PathVariable Long firId) {
                return ResponseEntity.ok(firService.getFIRUpdates(firId));
        }

        // ==================== Missing Person Endpoints ====================

        /**
         * File a new Missing Person report.
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
         * Get all Missing Person reports filed by the current user.
         */
        @GetMapping("/missing-reports")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<List<MissingPerson>> getMyMissingReports(HttpServletRequest httpRequest) {
                Long userId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(missingPersonService.getReportsByUser(userId));
        }

        /**
         * Get a specific Missing Person report by ID.
         */
        @GetMapping("/missing/{id}")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReport(@PathVariable Long id) {
                return ResponseEntity.ok(missingPersonService.getReportById(id));
        }

        /**
         * Get a specific Missing Person report by case number.
         */
        @GetMapping("/missing/number/{caseNumber}")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReportByNumber(@PathVariable String caseNumber) {
                return ResponseEntity.ok(missingPersonService.getReportByCaseNumber(caseNumber));
        }

        /**
         * Get status updates for a specific Missing Person report.
         */
        @GetMapping("/missing/{reportId}/updates")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<List<Update>> getMissingReportUpdates(@PathVariable Long reportId) {
                return ResponseEntity.ok(missingPersonService.getReportUpdates(reportId));
        }
}
