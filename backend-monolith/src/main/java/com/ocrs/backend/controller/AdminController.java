package com.ocrs.backend.controller;

import com.ocrs.backend.dto.AnalyticsResponse;
import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.AuthorityRegisterRequest;
import com.ocrs.backend.entity.Authority;
import com.ocrs.backend.entity.FIR;
import com.ocrs.backend.entity.MissingPerson;
import com.ocrs.backend.entity.User;
import com.ocrs.backend.repository.AuthorityRepository;
import com.ocrs.backend.repository.UserRepository;
import com.ocrs.backend.service.AnalyticsService;
import com.ocrs.backend.service.FIRService;
import com.ocrs.backend.service.MissingPersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

        @Autowired
        private FIRService firService;

        @Autowired
        private MissingPersonService missingPersonService;

        @Autowired
        private AnalyticsService analyticsService;

        @Autowired
        private AuthorityRepository authorityRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @PostMapping("/authority")
        @Transactional
        public ResponseEntity<ApiResponse<Authority>> createAuthority(
                        @RequestBody AuthorityRegisterRequest request) {
                if (userRepository.existsByEmail(request.getEmail())) {
                        return ResponseEntity.badRequest().body(ApiResponse.error("Email already registered"));
                }

                User user = User.builder()
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .role(User.Role.AUTHORITY)
                                .fullName(request.getFullName())
                                .phone(request.getPhone()) // Mapping phone to User as well for consistency
                                .build();
                User savedUser = userRepository.save(user);

                Authority authority = Authority.builder()
                                .id(savedUser.getId())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .fullName(request.getFullName())
                                .badgeNumber(request.getBadgeNumber())
                                .designation(request.getDesignation())
                                .stationName(request.getStationName())
                                .stationAddress(request.getStationAddress())
                                .phone(request.getPhone())
                                .isActive(true)
                                .build();

                Authority savedAuth = authorityRepository.save(authority);
                return ResponseEntity.ok(ApiResponse.success("Authority created successfully", savedAuth));
        }

        // Analytics
        @GetMapping("/analytics")
        public ResponseEntity<AnalyticsResponse> getAnalytics() {
                return ResponseEntity.ok(analyticsService.getAnalytics());
        }

        // FIR Management
        @GetMapping("/firs")
        public ResponseEntity<List<FIR>> getAllFIRs() {
                return ResponseEntity.ok(firService.getAllFIRs());
        }

        @GetMapping("/fir/{id}")
        public ResponseEntity<ApiResponse<FIR>> getFIR(@PathVariable Long id) {
                return ResponseEntity.ok(firService.getFIRById(id));
        }

        @PutMapping("/fir/{firId}/reassign/{authorityId}")
        public ResponseEntity<ApiResponse<FIR>> reassignFIR(
                        @PathVariable Long firId,
                        @PathVariable Long authorityId) {
                ApiResponse<FIR> response = firService.reassignFIR(firId, authorityId);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        // Missing Person Management
        @GetMapping("/missing-reports")
        public ResponseEntity<List<MissingPerson>> getAllMissingReports() {
                return ResponseEntity.ok(missingPersonService.getAllReports());
        }

        @GetMapping("/missing/{id}")
        public ResponseEntity<ApiResponse<MissingPerson>> getMissingReport(@PathVariable Long id) {
                return ResponseEntity.ok(missingPersonService.getReportById(id));
        }

        @PutMapping("/missing/{reportId}/reassign/{authorityId}")
        public ResponseEntity<ApiResponse<MissingPerson>> reassignMissingReport(
                        @PathVariable Long reportId,
                        @PathVariable Long authorityId) {
                ApiResponse<MissingPerson> response = missingPersonService.reassignReport(reportId, authorityId);
                return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        }

        // Authority Management
        @GetMapping("/authorities")
        public ResponseEntity<List<Authority>> getAllAuthorities() {
                return ResponseEntity.ok(authorityRepository.findAll());
        }

        @GetMapping("/authorities/active")
        public ResponseEntity<List<Authority>> getActiveAuthorities() {
                return ResponseEntity.ok(authorityRepository.findByIsActiveTrue());
        }

        @GetMapping("/authority/{id}")
        public ResponseEntity<ApiResponse<Authority>> getAuthority(@PathVariable Long id) {
                return authorityRepository.findById(id)
                                .map(auth -> ResponseEntity.ok(ApiResponse.success("Authority found", auth)))
                                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("Authority not found")));
        }

        @PutMapping("/authority/{id}")
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
                                        auth.setIsActive(updatedAuth.getIsActive());
                                        Authority saved = authorityRepository.save(auth);
                                        return ResponseEntity.ok(
                                                        ApiResponse.success("Authority updated successfully", saved));
                                })
                                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("Authority not found")));
        }

        @DeleteMapping("/authority/{id}")
        public ResponseEntity<ApiResponse<Void>> deleteAuthority(@PathVariable Long id) {
                return authorityRepository.findById(id)
                                .map(auth -> {
                                        auth.setIsActive(false);
                                        authorityRepository.save(auth);
                                        return ResponseEntity.ok(ApiResponse
                                                        .<Void>success("Authority deactivated successfully", null));
                                })
                                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("Authority not found")));
        }
}
