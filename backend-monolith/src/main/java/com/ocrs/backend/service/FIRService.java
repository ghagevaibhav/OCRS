package com.ocrs.backend.service;

import com.ocrs.backend.client.AuthServiceClient;
import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.AuthorityDTO;
import com.ocrs.backend.dto.FIRRequest;
import com.ocrs.backend.dto.UpdateRequest;
import com.ocrs.backend.dto.UserDTO;
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
         * helper method to get user's email from Auth service via Feign
         */
        private String getUserEmail(Long userId) {
                if (userId == null) {
                        return null;
                }
                try {
                        ApiResponse<UserDTO> response = authServiceClient.getUserById(userId);
                        if (response.isSuccess() && response.getData() != null) {
                                return response.getData().getEmail();
                        }
                } catch (Exception e) {
                        logger.warn("Failed to fetch user email for ID {}: {}", userId, e.getMessage());
                }
                return null;
        }

        /**
         * helper method to get authority name from Auth service via Feign
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
         * helper method to check if authority exists via Feign
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

        /**
         * determine priority based on crime category using rule-based mapping.
         * this replaces user-selected priority to prevent bias toward HIGH selections.
         */
        private FIR.Priority determinePriority(FIR.Category category) {
                return switch (category) {
                        case ASSAULT -> FIR.Priority.URGENT; // physical violence - immediate attention
                        case HARASSMENT -> FIR.Priority.HIGH; // personal safety concern
                        case CYBERCRIME -> FIR.Priority.HIGH; // time-sensitive (evidence can be deleted)
                        case FRAUD -> FIR.Priority.MEDIUM; // financial crime, less immediate
                        case THEFT -> FIR.Priority.MEDIUM; // property crime
                        case VANDALISM -> FIR.Priority.LOW; // property damage, non-violent
                        case OTHER -> FIR.Priority.MEDIUM; // default for unclassified
                };
        }

        @Transactional
        public ApiResponse<FIR> fileFIR(Long userId, FIRRequest request) {
                try {
                        // generate unique FIR number
                        String firNumber = "FIR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

                        // auto-assign to authority with least active cases
                        Long authorityId = findLeastLoadedAuthority();
                        String authorityName = null;

                        if (authorityId != null) {
                                authorityName = getAuthorityName(authorityId);
                                logger.info("Auto-assigning FIR {} to authority {} (ID: {})", firNumber, authorityName,
                                                authorityId);
                        } else {
                                logger.warn("No active authorities available - FIR {} will be unassigned", firNumber);
                        }

                        // determine priority based on category (automatic assignment)
                        FIR.Category category = FIR.Category.valueOf(request.getCategory().toUpperCase());
                        FIR.Priority autoPriority = determinePriority(category);
                        logger.info("Auto-assigned priority {} for category {} in FIR {}", autoPriority, category,
                                        firNumber);

                        FIR fir = FIR.builder()
                                        .firNumber(firNumber)
                                        .userId(userId)
                                        .authorityId(authorityId)
                                        .category(category)
                                        .title(request.getTitle())
                                        .description(request.getDescription())
                                        .incidentDate(request.getIncidentDate())
                                        .incidentTime(request.getIncidentTime())
                                        .incidentLocation(request.getIncidentLocation())
                                        .status(FIR.Status.PENDING)
                                        .priority(autoPriority)
                                        .evidenceUrls(request.getEvidenceUrls())
                                        .build();

                        fir = firRepository.save(fir);
                        logger.info("FIR filed: {} by user {}, assigned to authority: {} ({})", firNumber, userId,
                                        authorityName, authorityId);

                        // notify external services with FIR number and authority details
                        // fetch user's email for notification
                        String userEmail = getUserEmail(userId);
                        externalServiceClient.sendFirFiledNotification(userId, userEmail, firNumber, authorityId,
                                        authorityName);
                        externalServiceClient.logEvent("FIR_FILED", userId, firNumber);

                        return ApiResponse.success("FIR filed successfully", fir);
                } catch (Exception e) {
                        logger.error("Error filing FIR: ", e);
                        return ApiResponse.error("Failed to file FIR: " + e.getMessage());
                }
        }

        /**
         * find the authority with the least number of active (non-resolved) cases.
         * uses load balancing to distribute FIRs evenly across authorities.
         */
        private Long findLeastLoadedAuthority() {
                try {
                        // get all active authorities from Auth service via Feign
                        ApiResponse<List<AuthorityDTO>> response = authServiceClient.getActiveAuthorities();

                        if (!response.isSuccess() || response.getData() == null || response.getData().isEmpty()) {
                                logger.warn("No active authorities found for auto-assignment");
                                return null;
                        }

                        List<AuthorityDTO> activeAuthorities = response.getData();

                        // determine authority with minimum active cases
                        Long leastLoadedAuthority = null;
                        long minCases = Long.MAX_VALUE;

                        for (AuthorityDTO authority : activeAuthorities) {
                                // count active (non-closed, non-resolved) FIRs for this authority
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

                // verify authority is assigned to this FIR
                if (fir.getAuthorityId() == null || !fir.getAuthorityId().equals(authorityId)) {
                        return ApiResponse.error("You are not authorized to update this FIR");
                }

                // prevent updates on closed cases - closed cases are final
                if (fir.getStatus() == FIR.Status.CLOSED) {
                        logger.warn("Rejected update attempt on closed FIR {} by authority {}",
                                        fir.getFirNumber(), authorityId);
                        return ApiResponse.error(
                                        "Cannot update a closed case. Closed cases are final and cannot be modified.");
                }

                // get authority details for notifications via Feign
                String authorityName = getAuthorityName(authorityId);

                String previousStatus = fir.getStatus().name();

                if (request.getNewStatus() != null) {
                        fir.setStatus(FIR.Status.valueOf(request.getNewStatus().toUpperCase()));
                }

                fir = firRepository.save(fir);

                // create update record
                Update update = Update.builder()
                                .firId(firId)
                                .authorityId(authorityId)
                                .updateType(Update.UpdateType.valueOf(request.getUpdateType().toUpperCase()))
                                .previousStatus(previousStatus)
                                .newStatus(fir.getStatus().name())
                                .comment(request.getComment())
                                .build();

                updateRepository.save(update);

                // send detailed FIR update notification to user
                // fetch user's email for notification
                String userEmail = getUserEmail(fir.getUserId());
                externalServiceClient.sendFirUpdateNotification(
                                fir.getUserId(),
                                userEmail,
                                fir.getFirNumber(),
                                request.getUpdateType(),
                                fir.getStatus().name(),
                                previousStatus,
                                authorityId,
                                authorityName,
                                request.getComment());

                // log the update event with detailed message
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

                // verify authority exists via Feign
                if (!authorityExists(newAuthorityId)) {
                        return ApiResponse.error("Authority not found");
                }

                if (fir.getAuthorityId() != null && fir.getAuthorityId().equals(newAuthorityId)) {
                        return ApiResponse.error("Cannot reassign to the same authority");
                }

                // get authority name via Feign
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

                // send email notification to user about reassignment
                String userEmail = getUserEmail(fir.getUserId());
                externalServiceClient.sendEmailNotification(fir.getUserId(), userEmail, "FIR Reassigned",
                                "Your FIR " + fir.getFirNumber() + " has been reassigned to a new officer: "
                                                + authorityName);

                // log the reassignment event
                externalServiceClient.logEvent("FIR_REASSIGNED", newAuthorityId, fir.getFirNumber(),
                                "FIR reassigned from authority " + previousAuthorityId + " to " + newAuthorityId);

                logger.info("FIR {} reassigned to authority {}", fir.getFirNumber(), newAuthorityId);
                return ApiResponse.success("FIR reassigned successfully", fir);
        }
}
