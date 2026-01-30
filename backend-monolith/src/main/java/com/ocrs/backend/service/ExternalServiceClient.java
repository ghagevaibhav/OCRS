package com.ocrs.backend.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

// client for external services with async processing and retry support
@Service
public class ExternalServiceClient {

        private static final Logger logger = LoggerFactory.getLogger(ExternalServiceClient.class);

        private final WebClient webClient;

        @Value("${services.email-url}")
        private String emailServiceUrl;

        @Value("${services.logging-url}")
        private String loggingServiceUrl;

        public ExternalServiceClient(WebClient.Builder webClientBuilder) {
                HttpClient httpClient = HttpClient.create()
                                .responseTimeout(Duration.ofSeconds(5));

                this.webClient = webClientBuilder
                                .clientConnector(new ReactorClientHttpConnector(httpClient))
                                .build();
        }

        // async email notification - non-blocking
        @Async
        @Retry(name = "emailService", fallbackMethod = "emailFallback")
        @CircuitBreaker(name = "emailService", fallbackMethod = "emailFallback")
        public CompletableFuture<Void> sendEmailNotification(Long userId, String userEmail, String subject,
                        String message) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("userId", userId);
                if (userEmail != null) {
                        payload.put("email", userEmail);
                }
                payload.put("subject", subject);
                payload.put("message", message);
                payload.put("timestamp", System.currentTimeMillis());

                return sendPostRequest(
                                emailServiceUrl + "/api/notify",
                                payload,
                                () -> logger.info("email notification sent: {} to {}", subject, userEmail));
        }

        /**
         * Send an email notification about a filed FIR to the configured email service.
         *
         * @param userId the identifier of the user related to the FIR
         * @param userEmail the recipient email address; omitted from the payload if null
         * @param firNumber the FIR number included in the notification subject and payload
         * @param authorityId the identifier of the authority assigned to the FIR
         * @param authorityName the display name of the authority; if null, "Pending Assignment" is used
         * @return a CompletableFuture<Void> that completes when the notification request has been submitted
         */
        @Async
        @Retry(name = "emailService", fallbackMethod = "firFiledEmailFallback")
        @CircuitBreaker(name = "emailService", fallbackMethod = "firFiledEmailFallback")
        public CompletableFuture<Void> sendFirFiledNotification(Long userId, String userEmail, String firNumber,
                        Long authorityId, String authorityName) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("userId", userId);
                if (userEmail != null) {
                        payload.put("email", userEmail);
                }
                payload.put("subject", "FIR Filed Successfully - " + firNumber);
                payload.put("firNumber", firNumber);
                payload.put("authorityId", authorityId);
                payload.put("authorityName", authorityName != null ? authorityName : "Pending Assignment");
                payload.put("template", "firFiled");
                payload.put("timestamp", System.currentTimeMillis());

                return sendPostRequest(
                                emailServiceUrl + "/api/notify",
                                payload,
                                () -> logger.info("FIR filed notification sent for {} to user {} ({})", firNumber,
                                                userId,
                                                userEmail));
        }

        /**
         * Send an email notification for a filed missing person report.
         *
         * @param userId           ID of the user who filed the report
         * @param userEmail        optional recipient email address
         * @param caseNumber       unique identifier for the missing person case
         * @param missingPersonName name of the missing person
         * @param age              optional age of the missing person
         * @param gender           optional gender of the missing person
         * @param height           optional height description of the missing person
         * @param complexion       optional complexion description of the missing person
         * @param lastSeenDate     optional date when the person was last seen
         * @param lastSeenLocation optional location where the person was last seen
         * @param description      optional additional descriptive details
         * @param authorityId      identifier of the authority handling the case
         * @param authorityName    optional name of the authority; defaults to "Pending Assignment" when null
         * @param status           optional case status; defaults to "Pending" when null
         * @return                 a CompletableFuture that completes when the notification request completes
         */
        @Async
        @Retry(name = "emailService", fallbackMethod = "missingPersonFiledEmailFallback")
        @CircuitBreaker(name = "emailService", fallbackMethod = "missingPersonFiledEmailFallback")
        public CompletableFuture<Void> sendMissingPersonFiledNotification(
                        Long userId, String userEmail, String caseNumber,
                        String missingPersonName, Integer age, String gender,
                        String height, String complexion,
                        String lastSeenDate, String lastSeenLocation, String description,
                        Long authorityId, String authorityName, String status) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("userId", userId);
                if (userEmail != null) {
                        payload.put("email", userEmail);
                }
                payload.put("subject", "Missing Person Report Filed - " + caseNumber);
                payload.put("caseNumber", caseNumber);
                payload.put("missingPersonName", missingPersonName);
                if (age != null)
                        payload.put("age", age);
                if (gender != null)
                        payload.put("gender", gender);
                if (height != null)
                        payload.put("height", height);
                if (complexion != null)
                        payload.put("complexion", complexion);
                if (lastSeenDate != null)
                        payload.put("lastSeenDate", lastSeenDate);
                if (lastSeenLocation != null)
                        payload.put("lastSeenLocation", lastSeenLocation);
                if (description != null)
                        payload.put("description", description);
                payload.put("authorityId", authorityId);
                payload.put("authorityName", authorityName != null ? authorityName : "Pending Assignment");
                payload.put("status", status != null ? status : "Pending");
                payload.put("template", "missingPersonFiled");
                payload.put("timestamp", System.currentTimeMillis());

                return sendPostRequest(
                                emailServiceUrl + "/api/notify",
                                payload,
                                () -> logger.info("Missing person report notification sent for {} to user {} ({})",
                                                caseNumber, userId, userEmail));
        }

        /**
         * Send an email notification about an update to a missing person report.
         *
         * @param userId            the identifier of the user associated with the report
         * @param userEmail         the recipient email address; may be null to skip including an email
         * @param caseNumber        the missing person case/reference number
         * @param missingPersonName the name of the missing person; may be null if not available
         * @param updateType        a short label describing the type of update (e.g., "status_change")
         * @param newStatus         the report's new status
         * @param previousStatus    the report's previous status; may be null if not applicable
         * @param authorityId       the identifier of the authority handling the report
         * @param authorityName     the name of the authority handling the report
         * @param comment           an optional comment describing the update; may be null
         * @return                  a CompletableFuture that completes when the notification request finishes
         */
        @Async
        @Retry(name = "emailService", fallbackMethod = "missingPersonUpdateEmailFallback")
        @CircuitBreaker(name = "emailService", fallbackMethod = "missingPersonUpdateEmailFallback")
        public CompletableFuture<Void> sendMissingPersonUpdateNotification(
                        Long userId, String userEmail, String caseNumber,
                        String missingPersonName, String updateType,
                        String newStatus, String previousStatus,
                        Long authorityId, String authorityName, String comment) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("userId", userId);
                if (userEmail != null)
                        payload.put("email", userEmail);
                payload.put("subject", "Missing Person Report Updated - " + caseNumber);
                payload.put("caseNumber", caseNumber);
                if (missingPersonName != null)
                        payload.put("missingPersonName", missingPersonName);
                payload.put("updateType", updateType);
                payload.put("newStatus", newStatus);
                if (previousStatus != null)
                        payload.put("previousStatus", previousStatus);
                payload.put("authorityId", authorityId);
                payload.put("authorityName", authorityName);
                if (comment != null)
                        payload.put("comment", comment);
                payload.put("template", "missingPersonUpdate");
                payload.put("timestamp", System.currentTimeMillis());

                return sendPostRequest(
                                emailServiceUrl + "/api/notify",
                                payload,
                                () -> logger.info("Missing person update notification sent for {} to user {}",
                                                caseNumber, userId));
        }

        /**
         * Send a notification email when a missing person report is reassigned.
         *
         * Builds a payload with case, missing person, status, and authority reassignment details and posts it to the configured email service.
         *
         * @param userId                ID of the user that triggered or should receive the notification
         * @param userEmail             recipient email address; omitted from payload if null
         * @param caseNumber            identifier of the missing person case
         * @param missingPersonName     name of the missing person; omitted from payload if null
         * @param status                current status of the case; omitted from payload if null
         * @param newAuthorityId        ID of the authority to which the case was reassigned
         * @param newAuthorityName      name of the new authority; substituted with "N/A" if null
         * @param previousAuthorityId   ID of the previous authority; omitted from payload if null
         * @param previousAuthorityName name of the previous authority; omitted from payload if null
         * @return                      a CompletableFuture that completes when the notification request has been dispatched
         */
        @Async
        @Retry(name = "emailService", fallbackMethod = "missingPersonReassignedEmailFallback")
        @CircuitBreaker(name = "emailService", fallbackMethod = "missingPersonReassignedEmailFallback")
        public CompletableFuture<Void> sendMissingPersonReassignedNotification(
                        Long userId, String userEmail, String caseNumber,
                        String missingPersonName, String status,
                        Long newAuthorityId, String newAuthorityName,
                        Long previousAuthorityId, String previousAuthorityName) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("userId", userId);
                if (userEmail != null)
                        payload.put("email", userEmail);
                payload.put("subject", "Missing Person Report Reassigned - " + caseNumber);
                payload.put("caseNumber", caseNumber);
                if (missingPersonName != null)
                        payload.put("missingPersonName", missingPersonName);
                if (status != null)
                        payload.put("status", status);
                payload.put("newAuthorityId", newAuthorityId);
                payload.put("newAuthorityName", newAuthorityName != null ? newAuthorityName : "N/A");
                if (previousAuthorityId != null)
                        payload.put("previousAuthorityId", previousAuthorityId);
                if (previousAuthorityName != null)
                        payload.put("previousAuthorityName", previousAuthorityName);
                payload.put("template", "missingPersonReassigned");
                payload.put("timestamp", System.currentTimeMillis());

                return sendPostRequest(
                                emailServiceUrl + "/api/notify",
                                payload,
                                () -> logger.info("Missing person reassignment notification sent for {} to user {}",
                                                caseNumber, userId));
        }

        /**
         * Send a FIR update notification to the configured email service.
         *
         * @param userId        the ID of the user associated with the FIR
         * @param userEmail     optional recipient email address; omitted if null
         * @param firNumber     the FIR identifier
         * @param updateType    a short label describing the type of update (e.g., "status_change")
         * @param newStatus     the FIR's new status
         * @param previousStatus optional previous status value; omitted if null
         * @param authorityId   the ID of the authority handling the FIR
         * @param authorityName the name of the authority handling the FIR
         * @param comment       optional additional comment to include in the notification; omitted if null
         * @return a CompletableFuture that completes when the notification request has been processed
         */
        @Async
        @Retry(name = "emailService", fallbackMethod = "firUpdateEmailFallback")
        @CircuitBreaker(name = "emailService", fallbackMethod = "firUpdateEmailFallback")
        public CompletableFuture<Void> sendFirUpdateNotification(Long userId, String userEmail, String firNumber,
                        String updateType, String newStatus, String previousStatus,
                        Long authorityId, String authorityName, String comment) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("userId", userId);
                if (userEmail != null)
                        payload.put("email", userEmail);
                payload.put("subject", "FIR Status Updated - " + firNumber);
                payload.put("firNumber", firNumber);
                payload.put("updateType", updateType);
                payload.put("newStatus", newStatus);
                if (previousStatus != null)
                        payload.put("previousStatus", previousStatus);
                payload.put("authorityId", authorityId);
                payload.put("authorityName", authorityName);
                if (comment != null)
                        payload.put("comment", comment);
                payload.put("timestamp", System.currentTimeMillis());

                return sendPostRequest(
                                emailServiceUrl + "/api/notify",
                                payload,
                                () -> logger.info("FIR update notification sent for {} to user {}", firNumber, userId));
        }

        public CompletableFuture<Void> emailFallback(Long userId, String userEmail, String subject, String message,
                        Exception e) {
                logger.warn("email service unavailable, skipping notification for user {} ({}): {}", userId, userEmail,
                                subject);
                return CompletableFuture.completedFuture(null);
        }

        public CompletableFuture<Void> firFiledEmailFallback(Long userId, String userEmail, String firNumber,
                        Long authorityId, String authorityName, Exception e) {
                logger.warn("email service unavailable, skipping FIR filed notification for FIR {} to user {} ({})",
                                firNumber, userId, userEmail);
                return CompletableFuture.completedFuture(null);
        }

        /**
         * Fallback invoked when the email service is unavailable for an FIR update notification.
         *
         * @param userId        identifier of the user who would receive the notification
         * @param userEmail     email address of the user (may be null)
         * @param firNumber     FIR number associated with the update
         * @param updateType    type or category of the update
         * @param newStatus     the FIR's new status
         * @param previousStatus the FIR's previous status (may be null)
         * @param authorityId   identifier of the authority responsible for the FIR (may be null)
         * @param authorityName display name of the authority (may be null)
         * @param comment       optional comment included with the update (may be null)
         * @param e             the exception that caused the fallback to execute
         * @return              a completed CompletableFuture with a null result
         */
        public CompletableFuture<Void> firUpdateEmailFallback(Long userId, String userEmail, String firNumber,
                        String updateType, String newStatus, String previousStatus,
                        Long authorityId, String authorityName, String comment, Exception e) {
                logger.warn("email service unavailable, skipping FIR update notification for FIR {} to user {}",
                                firNumber, userId);
                return CompletableFuture.completedFuture(null);
        }

        /**
         * Fallback invoked when the email service is unavailable for a missing-person filing notification.
         *
         * @param userId          the identifier of the user the notification was intended for
         * @param userEmail       the recipient email address (may be null)
         * @param caseNumber      the missing-person case identifier
         * @param missingPersonName the reported missing person's name
         * @param age             the reported age (may be null)
         * @param gender          the reported gender (may be null)
         * @param height          the reported height or height description (may be null)
         * @param complexion      the reported complexion or build (may be null)
         * @param lastSeenDate    the last-seen date string (may be null)
         * @param lastSeenLocation the last-seen location description (may be null)
         * @param description     additional descriptive details (may be null)
         * @param authorityId     the identifier of the authority assigned to the case (may be null)
         * @param authorityName   the name of the authority assigned to the case (may be null)
         * @param status          the current case status (may be null)
         * @param e               the exception that caused the fallback to be triggered
         * @return                a completed CompletableFuture with a null result
         */
        public CompletableFuture<Void> missingPersonFiledEmailFallback(
                        Long userId, String userEmail, String caseNumber,
                        String missingPersonName, Integer age, String gender,
                        String height, String complexion,
                        String lastSeenDate, String lastSeenLocation, String description,
                        Long authorityId, String authorityName, String status, Exception e) {
                logger.warn("email service unavailable, skipping missing person notification for case {} to user {} ({})",
                                caseNumber, userId, userEmail);
                return CompletableFuture.completedFuture(null);
        }

        /**
         * Handle the fallback when the email service is unavailable for a missing-person update notification.
         *
         * @param userId          the identifier of the user for whom the notification was intended
         * @param userEmail       the recipient email address, may be null
         * @param caseNumber      the missing-person case reference number
         * @param missingPersonName the name of the missing person related to the update
         * @param updateType      a brief label describing the type of update
         * @param newStatus       the new status after the update, may be null
         * @param previousStatus  the status prior to the update, may be null
         * @param authorityId     the identifier of the authority handling the case, may be null
         * @param authorityName   the name of the authority handling the case, may be null
         * @param comment         an optional comment associated with the update, may be null
         * @param e               the exception that triggered this fallback
         * @return                a completed CompletableFuture<Void>
         */
        public CompletableFuture<Void> missingPersonUpdateEmailFallback(
                        Long userId, String userEmail, String caseNumber,
                        String missingPersonName, String updateType,
                        String newStatus, String previousStatus,
                        Long authorityId, String authorityName, String comment, Exception e) {
                logger.warn("email service unavailable, skipping missing person update notification for case {} to user {}",
                                caseNumber, userId);
                return CompletableFuture.completedFuture(null);
        }

        /**
         * Fallback invoked when the email service is unavailable for a missing-person reassignment notification.
         *
         * Logs a warning about skipping the notification and completes without performing any external call.
         *
         * @param userId                 the identifier of the user who would receive the notification
         * @param userEmail              the recipient's email address, if available
         * @param caseNumber             the missing-person case identifier
         * @param missingPersonName      the name of the missing person
         * @param status                 the current status of the missing-person case
         * @param newAuthorityId         the identifier of the authority to which the case was reassigned
         * @param newAuthorityName       the name of the authority to which the case was reassigned
         * @param previousAuthorityId    the identifier of the authority from which the case was reassigned
         * @param previousAuthorityName  the name of the authority from which the case was reassigned
         * @param e                      the exception that triggered the fallback
         * @return                       a completed CompletableFuture<Void> (completed with null)
         */
        public CompletableFuture<Void> missingPersonReassignedEmailFallback(
                        Long userId, String userEmail, String caseNumber,
                        String missingPersonName, String status,
                        Long newAuthorityId, String newAuthorityName,
                        Long previousAuthorityId, String previousAuthorityName, Exception e) {
                logger.warn("email service unavailable, skipping missing person reassignment notification for case {} to user {}",
                                caseNumber, userId);
                return CompletableFuture.completedFuture(null);
        }

        /**
         * Send an event entry to the external logging service without an associated message.
         *
         * @param eventType the type or name of the event
         * @param userId    the identifier of the user related to the event, or null if not applicable
         * @param reference a reference identifier related to the event (for example, an entity ID), or null if not applicable
         * @return          a CompletableFuture that completes when the logging operation finishes
         */
        @Async
        @Retry(name = "loggingService", fallbackMethod = "logFallback")
        @CircuitBreaker(name = "loggingService", fallbackMethod = "logFallback")
        public CompletableFuture<Void> logEvent(String eventType, Long userId, String reference) {
                return logEvent(eventType, userId, reference, null);
        }

        /**
         * Send an event log to the external logging service with optional message details.
         *
         * @param eventType a short identifier for the event being logged
         * @param userId    the identifier of the user associated with the event
         * @param reference an external reference or entity id related to the event
         * @param message   optional human-readable details about the event; included only if non-null
         * @return          a CompletableFuture that completes when the logging request has been processed
         */
        @Async
        @Retry(name = "loggingService", fallbackMethod = "logFallbackWithMessage")
        @CircuitBreaker(name = "loggingService", fallbackMethod = "logFallbackWithMessage")
        public CompletableFuture<Void> logEvent(String eventType, Long userId, String reference, String message) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("eventType", eventType);
                payload.put("userId", userId);
                payload.put("reference", reference);
                payload.put("timestamp", System.currentTimeMillis());
                if (message != null) {
                        payload.put("message", message);
                }

                return sendPostRequest(
                                loggingServiceUrl + "/api/log",
                                payload,
                                () -> logger.debug("event logged: {}", eventType));
        }

        public CompletableFuture<Void> logFallback(String eventType, Long userId, String reference, Exception e) {
                logger.warn("logging service unavailable, event not logged: {} for user {}", eventType, userId);
                return CompletableFuture.completedFuture(null);
        }

        public CompletableFuture<Void> logFallbackWithMessage(String eventType, Long userId, String reference,
                        String message, Exception e) {
                logger.warn("logging service unavailable, event not logged: {} for user {} - {}", eventType, userId,
                                message);
                return CompletableFuture.completedFuture(null);
        }

        /**
         * Helper method to send a POST request using WebClient.
         * Returns a CompletableFuture<Void> for async processing.
         */
        private CompletableFuture<Void> sendPostRequest(String url, Map<String, Object> payload, Runnable onSuccess) {
                return webClient.post()
                                .uri(url)
                                .bodyValue(payload)
                                .retrieve()
                                .bodyToMono(Void.class)
                                .doOnSuccess(v -> onSuccess.run())
                                .toFuture();
        }
}