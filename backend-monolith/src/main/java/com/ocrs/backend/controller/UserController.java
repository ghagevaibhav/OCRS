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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

        @Autowired
        private FIRService firService;

        @Autowired
        private MissingPersonService missingPersonService;

        // FIR Endpoints
        @PostMapping("/fir")
        public ResponseEntity<ApiResponse<FIR>> fileFIR(
                        @Valid @RequestBody FIRRequest request,
                        HttpServletRequest httpRequest) {
                Long userId = (Long) httpRequest.getAttribute("userId");
                ApiResponse<FIR> response = firService.fileFIR(userId, request);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        @GetMapping("/firs")
        public ResponseEntity<List<FIR>> getMyFIRs(HttpServletRequest httpRequest) {
                Long userId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(firService.getFIRsByUser(userId));
        }

        @GetMapping("/fir/{id}")
        public ResponseEntity<ApiResponse<FIR>> getFIR(@PathVariable Long id) {
                return ResponseEntity.ok(firService.getFIRById(id));
        }

        @GetMapping("/fir/number/{firNumber}")
        public ResponseEntity<ApiResponse<FIR>> getFIRByNumber(@PathVariable String firNumber) {
                return ResponseEntity.ok(firService.getFIRByNumber(firNumber));
        }

        @GetMapping("/fir/{firId}/updates")
        public ResponseEntity<List<Update>> getFIRUpdates(@PathVariable Long firId) {
                return ResponseEntity.ok(firService.getFIRUpdates(firId));
        }

        // Missing Person Endpoints
        @PostMapping("/missing")
        public ResponseEntity<ApiResponse<MissingPerson>> fileMissingReport(
                        @Valid @RequestBody MissingPersonRequest request,
                        HttpServletRequest httpRequest) {
                Long userId = (Long) httpRequest.getAttribute("userId");
                ApiResponse<MissingPerson> response = missingPersonService.fileReport(userId, request);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        @GetMapping("/missing-reports")
        public ResponseEntity<List<MissingPerson>> getMyMissingReports(HttpServletRequest httpRequest) {
                Long userId = (Long) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(missingPersonService.getReportsByUser(userId));
        }

        @GetMapping("/missing/{id}")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReport(@PathVariable Long id) {
                return ResponseEntity.ok(missingPersonService.getReportById(id));
        }

        @GetMapping("/missing/number/{caseNumber}")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReportByNumber(@PathVariable String caseNumber) {
                return ResponseEntity.ok(missingPersonService.getReportByCaseNumber(caseNumber));
        }

        @GetMapping("/missing/{reportId}/updates")
        public ResponseEntity<List<Update>> getMissingReportUpdates(@PathVariable Long reportId) {
                return ResponseEntity.ok(missingPersonService.getReportUpdates(reportId));
        }
}
