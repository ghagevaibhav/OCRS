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

        // FIR filed notification with FIR number and authority details
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

        // Missing Person report filed notification with detailed information
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

        // Missing Person report update notification
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

        // Missing Person report reassignment notification
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

        // Enhanced FIR update notification with detailed information
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

        public CompletableFuture<Void> firUpdateEmailFallback(Long userId, String userEmail, String firNumber,
                        String updateType, String newStatus, String previousStatus,
                        Long authorityId, String authorityName, String comment, Exception e) {
                logger.warn("email service unavailable, skipping FIR update notification for FIR {} to user {}",
                                firNumber, userId);
                return CompletableFuture.completedFuture(null);
        }

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

        public CompletableFuture<Void> missingPersonUpdateEmailFallback(
                        Long userId, String userEmail, String caseNumber,
                        String missingPersonName, String updateType,
                        String newStatus, String previousStatus,
                        Long authorityId, String authorityName, String comment, Exception e) {
                logger.warn("email service unavailable, skipping missing person update notification for case {} to user {}",
                                caseNumber, userId);
                return CompletableFuture.completedFuture(null);
        }

        public CompletableFuture<Void> missingPersonReassignedEmailFallback(
                        Long userId, String userEmail, String caseNumber,
                        String missingPersonName, String status,
                        Long newAuthorityId, String newAuthorityName,
                        Long previousAuthorityId, String previousAuthorityName, Exception e) {
                logger.warn("email service unavailable, skipping missing person reassignment notification for case {} to user {}",
                                caseNumber, userId);
                return CompletableFuture.completedFuture(null);
        }

        // async logging - non-blocking
        @Async
        @Retry(name = "loggingService", fallbackMethod = "logFallback")
        @CircuitBreaker(name = "loggingService", fallbackMethod = "logFallback")
        public CompletableFuture<Void> logEvent(String eventType, Long userId, String reference) {
                return logEvent(eventType, userId, reference, null);
        }

        // enhanced logging with message/details
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
