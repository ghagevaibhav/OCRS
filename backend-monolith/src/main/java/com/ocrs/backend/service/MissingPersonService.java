package com.ocrs.backend.service;

import com.ocrs.backend.client.AuthServiceClient;
import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.AuthorityDTO;
import com.ocrs.backend.dto.MissingPersonRequest;
import com.ocrs.backend.dto.UpdateRequest;
import com.ocrs.backend.dto.UserDTO;
import com.ocrs.backend.entity.MissingPerson;
import com.ocrs.backend.entity.Update;
import com.ocrs.backend.repository.MissingPersonRepository;
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
public class MissingPersonService {

        private static final Logger logger = LoggerFactory.getLogger(MissingPersonService.class);

        @Autowired
        private MissingPersonRepository missingPersonRepository;

        @Autowired
        private AuthServiceClient authServiceClient;

        @Autowired
        private UpdateRepository updateRepository;

        @Autowired
        private ExternalServiceClient externalServiceClient;

        /**
         * Helper method to get user's email from Auth service via Feign
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
        public ApiResponse<MissingPerson> fileReport(Long userId, MissingPersonRequest request) {
                try {
                        String caseNumber = "MP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

                        // Auto-assign to authority with least active cases
                        Long authorityId = findLeastLoadedAuthority();
                        String authorityName = null;

                        if (authorityId != null) {
                                authorityName = getAuthorityName(authorityId);
                                logger.info("Auto-assigning report {} to authority {} (ID: {})", caseNumber,
                                                authorityName, authorityId);
                        } else {
                                logger.warn("No active authorities available - report {} will be unassigned",
                                                caseNumber);
                        }

                        MissingPerson missingPerson = MissingPerson.builder()
                                        .caseNumber(caseNumber)
                                        .userId(userId)
                                        .authorityId(authorityId)
                                        .missingPersonName(request.getMissingPersonName())
                                        .age(request.getAge())
                                        .gender(request.getGender() != null
                                                        ? MissingPerson.Gender
                                                                        .valueOf(request.getGender().toUpperCase())
                                                        : null)
                                        .height(request.getHeight())
                                        .weight(request.getWeight())
                                        .complexion(request.getComplexion())
                                        .identifyingMarks(request.getIdentifyingMarks())
                                        .lastSeenDate(request.getLastSeenDate())
                                        .lastSeenLocation(request.getLastSeenLocation())
                                        .description(request.getDescription())
                                        .photoUrl(request.getPhotoUrl())
                                        .contactPhone(request.getContactPhone())
                                        .status(MissingPerson.MissingStatus.PENDING)
                                        .build();

                        missingPerson = missingPersonRepository.save(missingPerson);
                        logger.info("Missing person report filed: {} by user {}, assigned to authority: {} ({})",
                                        caseNumber, userId, authorityName, authorityId);

                        // Fetch user's email for notification
                        String userEmail = getUserEmail(userId);
                        // Send detailed missing person notification
                        externalServiceClient.sendMissingPersonFiledNotification(
                                        userId,
                                        userEmail,
                                        caseNumber,
                                        missingPerson.getMissingPersonName(),
                                        missingPerson.getAge(),
                                        missingPerson.getGender() != null ? missingPerson.getGender().name() : null,
                                        missingPerson.getHeight(),
                                        missingPerson.getComplexion(),
                                        missingPerson.getLastSeenDate() != null
                                                        ? missingPerson.getLastSeenDate().toString()
                                                        : null,
                                        missingPerson.getLastSeenLocation(),
                                        missingPerson.getDescription(),
                                        authorityId,
                                        authorityName,
                                        missingPerson.getStatus() != null ? missingPerson.getStatus().name()
                                                        : "PENDING");
                        externalServiceClient.logEvent("MISSING_PERSON_FILED", userId, caseNumber);

                        return ApiResponse.success("Missing person report filed successfully", missingPerson);
                } catch (Exception e) {
                        logger.error("Error filing missing person report: ", e);
                        return ApiResponse.error("Failed to file report: " + e.getMessage());
                }
        }

        /**
         * Find the authority with the least number of active cases.
         * Uses load balancing to distribute reports evenly across authorities.
         */
        private Long findLeastLoadedAuthority() {
                try {
                        ApiResponse<List<AuthorityDTO>> response = authServiceClient.getActiveAuthorities();

                        if (!response.isSuccess() || response.getData() == null || response.getData().isEmpty()) {
                                logger.warn("No active authorities found for auto-assignment");
                                return null;
                        }

                        List<AuthorityDTO> activeAuthorities = response.getData();
                        Long leastLoadedAuthority = null;
                        long minCases = Long.MAX_VALUE;

                        for (AuthorityDTO authority : activeAuthorities) {
                                long activeCases = missingPersonRepository.countActiveByAuthorityId(authority.getId());

                                if (activeCases < minCases) {
                                        minCases = activeCases;
                                        leastLoadedAuthority = authority.getId();
                                }
                        }

                        return leastLoadedAuthority;
                } catch (Exception e) {
                        logger.error("Error finding least loaded authority: {}", e.getMessage());
                        return null;
                }
        }

        public List<MissingPerson> getReportsByUser(Long userId) {
                return missingPersonRepository.findByUserId(userId);
        }

        public List<MissingPerson> getReportsByAuthority(Long authorityId) {
                return missingPersonRepository.findByAuthorityId(authorityId);
        }

        public Page<MissingPerson> getReportsByAuthorityPaged(Long authorityId, Pageable pageable) {
                return missingPersonRepository.findByAuthorityId(authorityId, pageable);
        }

        public ApiResponse<MissingPerson> getReportById(Long id) {
                return missingPersonRepository.findById(id)
                                .map(mp -> ApiResponse.success("Report found", mp))
                                .orElse(ApiResponse.error("Report not found"));
        }

        public ApiResponse<MissingPerson> getReportByCaseNumber(String caseNumber) {
                return missingPersonRepository.findByCaseNumber(caseNumber)
                                .map(mp -> ApiResponse.success("Report found", mp))
                                .orElse(ApiResponse.error("Report not found"));
        }

        @Transactional
        public ApiResponse<MissingPerson> updateReportStatus(Long reportId, Long authorityId, UpdateRequest request) {
                MissingPerson report = missingPersonRepository.findById(reportId).orElse(null);
                if (report == null) {
                        return ApiResponse.error("Report not found");
                }

                if (report.getAuthorityId() == null || !report.getAuthorityId().equals(authorityId)) {
                        return ApiResponse.error("You are not authorized to update this report");
                }

                // Prevent updates on closed cases - closed cases are final
                if (report.getStatus() == MissingPerson.MissingStatus.CLOSED) {
                        logger.warn("Rejected update attempt on closed report {} by authority {}",
                                        report.getCaseNumber(), authorityId);
                        return ApiResponse.error(
                                        "Cannot update a closed case. Closed cases are final and cannot be modified.");
                }

                // Get authority details for notifications via Feign
                String authorityName = getAuthorityName(authorityId);

                String previousStatus = report.getStatus().name();

                if (request.getNewStatus() != null) {
                        report.setStatus(MissingPerson.MissingStatus.valueOf(request.getNewStatus().toUpperCase()));
                }

                report = missingPersonRepository.save(report);

                Update update = Update.builder()
                                .missingPersonId(reportId)
                                .authorityId(authorityId)
                                .updateType(Update.UpdateType.valueOf(request.getUpdateType().toUpperCase()))
                                .previousStatus(previousStatus)
                                .newStatus(report.getStatus().name())
                                .comment(request.getComment())
                                .build();

                updateRepository.save(update);

                // Send detailed update notification to user
                String userEmail = getUserEmail(report.getUserId());
                externalServiceClient.sendMissingPersonUpdateNotification(
                                report.getUserId(),
                                userEmail,
                                report.getCaseNumber(),
                                report.getMissingPersonName(),
                                request.getUpdateType(),
                                report.getStatus().name(),
                                previousStatus,
                                authorityId,
                                authorityName,
                                request.getComment());

                // Log the update event with detailed message
                String logMessage = String.format("Case: %s, Authority: %s (ID: %d), Update: %s, Status: %s -> %s",
                                report.getCaseNumber(), authorityName, authorityId,
                                request.getUpdateType(), previousStatus, report.getStatus().name());
                externalServiceClient.logEvent("MISSING_PERSON_UPDATED", authorityId, report.getCaseNumber(),
                                logMessage);

                logger.info("Missing person report {} updated by authority {} ({})",
                                report.getCaseNumber(), authorityName, authorityId);
                return ApiResponse.success("Report updated successfully", report);
        }

        public List<Update> getReportUpdates(Long reportId) {
                return updateRepository.findByMissingPersonIdOrderByCreatedAtDesc(reportId);
        }

        public Page<MissingPerson> searchReportsByAuthority(Long authorityId, String search,
                        MissingPerson.MissingStatus status, Pageable pageable) {
                return missingPersonRepository.searchByAuthority(authorityId, search, status, pageable);
        }

        public List<MissingPerson> getAllReports() {
                return missingPersonRepository.findAll();
        }

        @Transactional
        public ApiResponse<MissingPerson> reassignReport(Long reportId, Long newAuthorityId) {
                MissingPerson report = missingPersonRepository.findById(reportId).orElse(null);
                if (report == null) {
                        return ApiResponse.error("Report not found");
                }

                // Verify authority exists via Feign
                if (!authorityExists(newAuthorityId)) {
                        return ApiResponse.error("Authority not found");
                }

                if (report.getAuthorityId() != null && report.getAuthorityId().equals(newAuthorityId)) {
                        return ApiResponse.error("Cannot reassign to the same authority");
                }

                // Get authority name via Feign
                String authorityName = getAuthorityName(newAuthorityId);

                Long previousAuthorityId = report.getAuthorityId();
                report.setAuthorityId(newAuthorityId);
                report = missingPersonRepository.save(report);

                // Create update record
                Update update = Update.builder()
                                .missingPersonId(reportId)
                                .authorityId(newAuthorityId)
                                .updateType(Update.UpdateType.REASSIGNMENT)
                                .comment("Reassigned from authority " + previousAuthorityId + " to " + newAuthorityId)
                                .build();

                updateRepository.save(update);

                // Fetch user's email and previous authority name for notification
                String userEmail = getUserEmail(report.getUserId());
                String previousAuthorityName = previousAuthorityId != null ? getAuthorityName(previousAuthorityId)
                                : null;

                externalServiceClient.sendMissingPersonReassignedNotification(
                                report.getUserId(),
                                userEmail,
                                report.getCaseNumber(),
                                report.getMissingPersonName(),
                                report.getStatus() != null ? report.getStatus().name() : "PENDING",
                                newAuthorityId,
                                authorityName,
                                previousAuthorityId,
                                previousAuthorityName);

                // Log the reassignment event
                externalServiceClient.logEvent("MISSING_PERSON_REASSIGNED", newAuthorityId, report.getCaseNumber(),
                                "Report reassigned from authority " + previousAuthorityId + " to " + newAuthorityId);

                logger.info("Missing person report {} reassigned to authority {}", report.getCaseNumber(),
                                newAuthorityId);
                return ApiResponse.success("Report reassigned successfully", report);
        }
}
