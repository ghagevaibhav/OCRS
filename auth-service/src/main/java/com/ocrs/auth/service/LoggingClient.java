package com.ocrs.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

// client for communicating with external logger service
@Service
public class LoggingClient {

        private static final Logger logger = LoggerFactory.getLogger(LoggingClient.class);

        private final WebClient webClient;

        @Value("${services.logging-url:http://localhost:5000}")
        private String loggingServiceUrl;

        public LoggingClient(WebClient.Builder webClientBuilder) {
                this.webClient = webClientBuilder.build();
        }

        // basic auth event logging
        public void logAuthEvent(String eventType, Long userId, String reference) {
                logAuthEvent(eventType, userId, reference, null, null);
        }

        // Enhanced auth event logging with user details
        public void logAuthEvent(String eventType, Long userId, String reference, String userName, String userEmail) {
                try {
                        Map<String, Object> payload = new HashMap<>();
                        payload.put("eventType", eventType);
                        payload.put("userId", userId);
                        payload.put("reference", reference);
                        payload.put("timestamp", System.currentTimeMillis());

                        if (userName != null) {
                                payload.put("userName", userName);
                        }
                        if (userEmail != null) {
                                payload.put("userEmail", userEmail);
                        }

                        // Build a descriptive message
                        String message = buildLogMessage(eventType, userId, userName, userEmail, reference);
                        if (message != null) {
                                payload.put("message", message);
                        }

                        webClient.post()
                                        .uri(loggingServiceUrl + "/api/log")
                                        .bodyValue(payload)
                                        .retrieve()
                                        .bodyToMono(String.class)
                                        .subscribe(
                                                        response -> logger.debug("auth event logged: {}", eventType),
                                                        error -> logger.warn("failed to log auth event: {}",
                                                                        error.getMessage()));
                } catch (Exception e) {
                        logger.warn("logging service unavailable: {}", e.getMessage());
                }
        }

        // Build descriptive log message based on event type
        private String buildLogMessage(String eventType, Long userId, String userName, String userEmail,
                        String reference) {
                StringBuilder sb = new StringBuilder();

                if (userName != null) {
                        sb.append("Name: ").append(userName);
                }
                if (userEmail != null) {
                        if (sb.length() > 0)
                                sb.append(", ");
                        sb.append("Email: ").append(userEmail);
                }

                return sb.length() > 0 ? sb.toString() : null;
        }
}
