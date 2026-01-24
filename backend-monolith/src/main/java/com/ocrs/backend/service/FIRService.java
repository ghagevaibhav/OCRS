package com.ocrs.backend.service;

import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.FIRRequest;
import com.ocrs.backend.dto.UpdateRequest;
import com.ocrs.backend.entity.Authority;
import com.ocrs.backend.entity.FIR;
import com.ocrs.backend.entity.Update;
import com.ocrs.backend.repository.AuthorityRepository;
import com.ocrs.backend.repository.FIRRepository;
import com.ocrs.backend.repository.UpdateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import java.util.UUID;

@Service
public class FIRService {

        private static final Logger logger = LoggerFactory.getLogger(FIRService.class);

        @Autowired
        private FIRRepository firRepository;

        @Autowired
        private AuthorityRepository authorityRepository;

        @Autowired
        private UpdateRepository updateRepository;

        @Autowired
        private ExternalServiceClient externalServiceClient;

        @Transactional
        public ApiResponse<FIR> fileFIR(Long userId, FIRRequest request) {
                try {
                        // Generate unique FIR number
                        String firNumber = "FIR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

                        // No initial assignment - Admin must assign
                        Long authorityId = null;
                        String authorityName = null;

                        FIR fir = FIR.builder()
                                        .firNumber(firNumber)
                                        .userId(userId)
                                        .authorityId(null)
                                        .category(FIR.Category.valueOf(request.getCategory().toUpperCase()))
                                        .title(request.getTitle())
                                        .description(request.getDescription())
                                        .incidentDate(request.getIncidentDate())
                                        .incidentTime(request.getIncidentTime())
                                        .incidentLocation(request.getIncidentLocation())
                                        .status(FIR.Status.PENDING)
                                        .priority(request.getPriority() != null
                                                        ? FIR.Priority.valueOf(request.getPriority().toUpperCase())
                                                        : FIR.Priority.MEDIUM)
                                        .evidenceUrls(request.getEvidenceUrls())
                                        .build();

                        fir = firRepository.save(fir);
                        logger.info("FIR filed: {} by user {}, assigned to authority: {} ({})", firNumber, userId,
                                        authorityName, authorityId);

                        // Notify external services with FIR number and authority details
                        externalServiceClient.sendFirFiledNotification(userId, firNumber, authorityId, authorityName);
                        externalServiceClient.logEvent("FIR_FILED", userId, firNumber);

                        return ApiResponse.success("FIR filed successfully", fir);
                } catch (Exception e) {
                        logger.error("Error filing FIR: ", e);
                        return ApiResponse.error("Failed to file FIR: " + e.getMessage());
                }
        }

        public List<FIR> getFIRsByUser(Long userId) {
                return firRepository.findByUserId(userId);
        }

        public List<FIR> getFIRsByAuthority(Long authorityId) {
                return firRepository.findByAuthorityId(authorityId);
        }

        public Page<FIR> getFIRsByAuthorityPaged(Long authorityId, Pageable pageable) {
                return firRepository.findByAuthorityId(authorityId, pageable);
        }

        public ApiResponse<FIR> getFIRById(Long id) {
                return firRepository.findById(id)
                                .map(fir -> ApiResponse.success("FIR found", fir))
                                .orElse(ApiResponse.error("FIR not found"));
        }

        public ApiResponse<FIR> getFIRByNumber(String firNumber) {
                return firRepository.findByFirNumber(firNumber)
                                .map(fir -> ApiResponse.success("FIR found", fir))
                                .orElse(ApiResponse.error("FIR not found"));
        }

        @Transactional
        public ApiResponse<FIR> updateFIRStatus(Long firId, Long authorityId, UpdateRequest request) {
                FIR fir = firRepository.findById(firId).orElse(null);
                if (fir == null) {
                        return ApiResponse.error("FIR not found");
                }

                // Verify authority is assigned to this FIR
                if (!fir.getAuthorityId().equals(authorityId)) {
                        return ApiResponse.error("You are not authorized to update this FIR");
                }

                // Get authority details for notifications
                Authority authority = authorityRepository.findById(authorityId).orElse(null);
                String authorityName = authority != null ? authority.getFullName() : "Unknown Authority";

                String previousStatus = fir.getStatus().name();

                if (request.getNewStatus() != null) {
                        fir.setStatus(FIR.Status.valueOf(request.getNewStatus().toUpperCase()));
                }

                fir = firRepository.save(fir);

                // Create update record
                Update update = Update.builder()
                                .firId(firId)
                                .authorityId(authorityId)
                                .updateType(Update.UpdateType.valueOf(request.getUpdateType().toUpperCase()))
                                .previousStatus(previousStatus)
                                .newStatus(fir.getStatus().name())
                                .comment(request.getComment())
                                .build();

                updateRepository.save(update);

                // Send detailed FIR update notification to user
                externalServiceClient.sendFirUpdateNotification(
                                fir.getUserId(),
                                null, // userEmail - will be looked up by email service
                                fir.getFirNumber(),
                                request.getUpdateType(),
                                fir.getStatus().name(),
                                previousStatus,
                                authorityId,
                                authorityName,
                                request.getComment());

                // Log the update event with detailed message
                String logMessage = String.format("FIR: %s, Authority: %s (ID: %d), Update: %s, Status: %s -> %s",
                                fir.getFirNumber(), authorityName, authorityId,
                                request.getUpdateType(), previousStatus, fir.getStatus().name());
                externalServiceClient.logEvent("FIR_UPDATED", authorityId, fir.getFirNumber(), logMessage);

                logger.info("FIR {} updated by authority {} ({})", fir.getFirNumber(), authorityName, authorityId);
                return ApiResponse.success("FIR updated successfully", fir);
        }

        public List<Update> getFIRUpdates(Long firId) {
                return updateRepository.findByFirIdOrderByCreatedAtDesc(firId);
        }

        public Page<FIR> searchFIRsByAuthority(Long authorityId, String search, FIR.Category category,
                        FIR.Priority priority, FIR.Status status, Pageable pageable) {
                return firRepository.searchByAuthority(authorityId, search, category, priority, status, pageable);
        }

        public List<FIR> getAllFIRs() {
                return firRepository.findAll();
        }

        @Transactional
        public ApiResponse<FIR> reassignFIR(Long firId, Long newAuthorityId) {
                FIR fir = firRepository.findById(firId).orElse(null);
                if (fir == null) {
                        return ApiResponse.error("FIR not found");
                }

                Authority authority = authorityRepository.findById(newAuthorityId).orElse(null);
                if (authority == null) {
                        return ApiResponse.error("Authority not found");
                }

                if (fir.getAuthorityId().equals(newAuthorityId)) {
                        return ApiResponse.error("Cannot reassign to the same authority");
                }

                Long previousAuthorityId = fir.getAuthorityId();
                fir.setAuthorityId(newAuthorityId);
                fir = firRepository.save(fir);

                // Create update record
                Update update = Update.builder()
                                .firId(firId)
                                .authorityId(newAuthorityId)
                                .updateType(Update.UpdateType.REASSIGNMENT)
                                .comment("Reassigned from authority " + previousAuthorityId + " to " + newAuthorityId)
                                .build();

                updateRepository.save(update);

                // Send email notification to user about reassignment
                externalServiceClient.sendEmailNotification(fir.getUserId(), "FIR Reassigned",
                                "Your FIR " + fir.getFirNumber() + " has been reassigned to a new officer: "
                                                + authority.getFullName());

                // Log the reassignment event
                externalServiceClient.logEvent("FIR_REASSIGNED", newAuthorityId, fir.getFirNumber(),
                                "FIR reassigned from authority " + previousAuthorityId + " to " + newAuthorityId);

                logger.info("FIR {} reassigned to authority {}", fir.getFirNumber(), newAuthorityId);
                return ApiResponse.success("FIR reassigned successfully", fir);
        }
}
