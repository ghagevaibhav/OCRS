package com.ocrs.backend.service;

import com.ocrs.backend.client.AuthServiceClient;
import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.AuthorityDTO;
import com.ocrs.backend.dto.FIRRequest;
import com.ocrs.backend.dto.UpdateRequest;
import com.ocrs.backend.entity.FIR;
import com.ocrs.backend.entity.Update;
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
        private AuthServiceClient authServiceClient;

        @Autowired
        private UpdateRepository updateRepository;

        @Autowired
        private ExternalServiceClient externalServiceClient;

        /**
         * Helper method to get authority name from Auth service via Feign
         */
        private String getAuthorityName(Long authorityId) {
                if (authorityId == null) {
                        return null;
                }
                try {
                        ApiResponse<AuthorityDTO> response = authServiceClient.getAuthorityById(authorityId);
                        if (response.isSuccess() && response.getData() != null) {
                                return response.getData().getFullName();
                        }
                } catch (Exception e) {
                        logger.warn("Failed to fetch authority name for ID {}: {}", authorityId, e.getMessage());
                }
                return "Authority #" + authorityId;
        }

        /**
         * Helper method to check if authority exists via Feign
         */
        private boolean authorityExists(Long authorityId) {
                if (authorityId == null) {
                        return false;
                }
                try {
                        ApiResponse<AuthorityDTO> response = authServiceClient.getAuthorityById(authorityId);
                        return response.isSuccess() && response.getData() != null;
                } catch (Exception e) {
                        logger.warn("Failed to check authority existence for ID {}: {}", authorityId, e.getMessage());
                        return false;
                }
        }

        @Transactional
        public ApiResponse<FIR> fileFIR(Long userId, FIRRequest request) {
                try {
                        // Generate unique FIR number
                        String firNumber = "FIR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

                        // Auto-assign to authority with least active cases
                        Long authorityId = findLeastLoadedAuthority();
                        String authorityName = null;

                        if (authorityId != null) {
                                authorityName = getAuthorityName(authorityId);
                                logger.info("Auto-assigning FIR {} to authority {} (ID: {})", firNumber, authorityName,
                                                authorityId);
                        } else {
                                logger.warn("No active authorities available - FIR {} will be unassigned", firNumber);
                        }

                        FIR fir = FIR.builder()
                                        .firNumber(firNumber)
                                        .userId(userId)
                                        .authorityId(authorityId)
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

        /**
         * Find the authority with the least number of active (non-resolved) cases.
         * Uses load balancing to distribute FIRs evenly across authorities.
         */
        private Long findLeastLoadedAuthority() {
                try {
                        // Get all active authorities from Auth service via Feign
                        ApiResponse<List<AuthorityDTO>> response = authServiceClient.getActiveAuthorities();

                        if (!response.isSuccess() || response.getData() == null || response.getData().isEmpty()) {
                                logger.warn("No active authorities found for auto-assignment");
                                return null;
                        }

                        List<AuthorityDTO> activeAuthorities = response.getData();

                        // Find authority with minimum active cases
                        Long leastLoadedAuthority = null;
                        long minCases = Long.MAX_VALUE;

                        for (AuthorityDTO authority : activeAuthorities) {
                                // Count active (non-closed, non-resolved) FIRs for this authority
                                long activeCases = firRepository.countActiveByAuthorityId(authority.getId());

                                logger.debug("Authority {} (ID: {}) has {} active cases",
                                                authority.getFullName(), authority.getId(), activeCases);

                                if (activeCases < minCases) {
                                        minCases = activeCases;
                                        leastLoadedAuthority = authority.getId();
                                }
                        }

                        logger.info("Least loaded authority ID: {} with {} active cases", leastLoadedAuthority,
                                        minCases);
                        return leastLoadedAuthority;

                } catch (Exception e) {
                        logger.error("Error finding least loaded authority: {}", e.getMessage());
                        return null;
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
                if (fir.getAuthorityId() == null || !fir.getAuthorityId().equals(authorityId)) {
                        return ApiResponse.error("You are not authorized to update this FIR");
                }

                // Get authority details for notifications via Feign
                String authorityName = getAuthorityName(authorityId);

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

                // Verify authority exists via Feign
                if (!authorityExists(newAuthorityId)) {
                        return ApiResponse.error("Authority not found");
                }

                if (fir.getAuthorityId() != null && fir.getAuthorityId().equals(newAuthorityId)) {
                        return ApiResponse.error("Cannot reassign to the same authority");
                }

                // Get authority name via Feign
                String authorityName = getAuthorityName(newAuthorityId);

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
                                                + authorityName);

                // Log the reassignment event
                externalServiceClient.logEvent("FIR_REASSIGNED", newAuthorityId, fir.getFirNumber(),
                                "FIR reassigned from authority " + previousAuthorityId + " to " + newAuthorityId);

                logger.info("FIR {} reassigned to authority {}", fir.getFirNumber(), newAuthorityId);
                return ApiResponse.success("FIR reassigned successfully", fir);
        }
}
