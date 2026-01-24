package com.ocrs.backend.service;

import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.MissingPersonRequest;
import com.ocrs.backend.dto.UpdateRequest;
import com.ocrs.backend.entity.Authority;
import com.ocrs.backend.entity.MissingPerson;
import com.ocrs.backend.entity.Update;
import com.ocrs.backend.repository.AuthorityRepository;
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
        private AuthorityRepository authorityRepository;

        @Autowired
        private UpdateRepository updateRepository;

        @Autowired
        private ExternalServiceClient externalServiceClient;

        @Transactional
        public ApiResponse<MissingPerson> fileReport(Long userId, MissingPersonRequest request) {
                try {
                        String caseNumber = "MP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

                        MissingPerson missingPerson = MissingPerson.builder()
                                        .caseNumber(caseNumber)
                                        .userId(userId)
                                        .authorityId(null)
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
                        logger.info("Missing person report filed: {} by user {}", caseNumber, userId);

                        externalServiceClient.sendEmailNotification(userId, "Missing Person Report Filed",
                                        "Your missing person report " + caseNumber + " has been filed successfully.");
                        externalServiceClient.logEvent("MISSING_PERSON_FILED", userId, caseNumber);

                        return ApiResponse.success("Missing person report filed successfully", missingPerson);
                } catch (Exception e) {
                        logger.error("Error filing missing person report: ", e);
                        return ApiResponse.error("Failed to file report: " + e.getMessage());
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

                if (!report.getAuthorityId().equals(authorityId)) {
                        return ApiResponse.error("You are not authorized to update this report");
                }

                // Get authority details for notifications
                Authority authority = authorityRepository.findById(authorityId).orElse(null);
                String authorityName = authority != null ? authority.getFullName() : "Unknown Authority";

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

                // Send detailed update notification
                externalServiceClient.sendFirUpdateNotification(
                                report.getUserId(),
                                null, // userEmail - will be looked up by email service
                                report.getCaseNumber(),
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

                Authority authority = authorityRepository.findById(newAuthorityId).orElse(null);
                if (authority == null) {
                        return ApiResponse.error("Authority not found");
                }

                if (report.getAuthorityId().equals(newAuthorityId)) {
                        return ApiResponse.error("Cannot reassign to the same authority");
                }

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

                externalServiceClient.sendEmailNotification(report.getUserId(), "Missing Person Report Reassigned",
                                "Your report " + report.getCaseNumber() + " has been reassigned to a new officer: "
                                                + authority.getFullName());

                // Log the reassignment event
                externalServiceClient.logEvent("MISSING_PERSON_REASSIGNED", newAuthorityId, report.getCaseNumber(),
                                "Report reassigned from authority " + previousAuthorityId + " to " + newAuthorityId);

                logger.info("Missing person report {} reassigned to authority {}", report.getCaseNumber(),
                                newAuthorityId);
                return ApiResponse.success("Report reassigned successfully", report);
        }
}
