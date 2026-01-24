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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/authority")
public class AuthorityController {

        @Autowired
        private FIRService firService;

        @Autowired
        private MissingPersonService missingPersonService;

        @Autowired
        private AnalyticsService analyticsService;

        @GetMapping("/analytics")
        public ResponseEntity<AuthorityAnalyticsResponse> getAnalytics(HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(analyticsService.getAuthorityAnalytics(authorityId));
        }

        // FIR Endpoints
        @GetMapping("/firs")
        public ResponseEntity<List<FIR>> getAssignedFIRs(HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(firService.getFIRsByAuthority(authorityId));
        }

        @GetMapping("/firs/paged")
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

        @GetMapping("/firs/search")
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

        @GetMapping("/fir/{id}")
        public ResponseEntity<ApiResponse<FIR>> getFIR(@PathVariable Long id) {
                return ResponseEntity.ok(firService.getFIRById(id));
        }

        @PutMapping("/fir/{firId}/update")
        public ResponseEntity<ApiResponse<FIR>> updateFIRStatus(
                        @PathVariable Long firId,
                        @Valid @RequestBody UpdateRequest request,
                        HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                ApiResponse<FIR> response = firService.updateFIRStatus(firId, authorityId, request);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        @GetMapping("/fir/{firId}/updates")
        public ResponseEntity<List<Update>> getFIRUpdates(@PathVariable Long firId) {
                return ResponseEntity.ok(firService.getFIRUpdates(firId));
        }

        // Missing Person Endpoints
        @GetMapping("/missing-reports")
        public ResponseEntity<List<MissingPerson>> getAssignedMissingReports(HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(missingPersonService.getReportsByAuthority(authorityId));
        }

        @GetMapping("/missing-reports/paged")
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

        @GetMapping("/missing-reports/search")
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
                return ResponseEntity.ok(missingPersonService.searchReportsByAuthority(authorityId, search, status, pageable));
        }

        @GetMapping("/missing/{id}")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReport(@PathVariable Long id) {
                return ResponseEntity.ok(missingPersonService.getReportById(id));
        }

        @PutMapping("/missing/{reportId}/update")
        public ResponseEntity<ApiResponse<MissingPerson>> updateMissingReportStatus(
                        @PathVariable Long reportId,
                        @Valid @RequestBody UpdateRequest request,
                        HttpServletRequest httpRequest) {
                Long authorityId = (Long) httpRequest.getAttribute("userId");
                ApiResponse<MissingPerson> response = missingPersonService.updateReportStatus(reportId, authorityId,
                                request);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        @GetMapping("/missing/{reportId}/updates")
        public ResponseEntity<List<Update>> getMissingReportUpdates(@PathVariable Long reportId) {
                return ResponseEntity.ok(missingPersonService.getReportUpdates(reportId));
        }
}
