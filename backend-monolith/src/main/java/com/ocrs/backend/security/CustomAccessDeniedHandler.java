package com.ocrs.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Custom AccessDeniedHandler that returns proper JSON error responses
 * for 403 Forbidden errors.
 */
@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

        private static final Logger logger = LoggerFactory.getLogger(CustomAccessDeniedHandler.class);
        private final ObjectMapper objectMapper;

        /**
         * Send a JSON 403 Forbidden response when access is denied.
         *
         * The JSON body contains:
         * <ul>
         *   <li><code>success</code>: false</li>
         *   <li><code>message</code>: "Access Denied: Insufficient permissions"</li>
         *   <li><code>path</code>: the request URI that triggered the denial</li>
         *   <li><code>timestamp</code>: current server time as an ISO-8601 string</li>
         * </ul>
         *
         * @param request the HTTP request that caused the access-denied event
         * @param response the HTTP response used to emit the JSON error payload
         * @param accessDeniedException the exception explaining why access was denied
         */
        @Override
        public void handle(HttpServletRequest request, HttpServletResponse response,
                        AccessDeniedException accessDeniedException) throws IOException, ServletException {
                logger.warn("Access denied to {}: {}", request.getRequestURI(),
                                accessDeniedException.getMessage());

                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);

                Map<String, Object> body = new LinkedHashMap<>();
                body.put("success", false);
                body.put("message", "Access Denied: Insufficient permissions");
                body.put("path", request.getRequestURI());
                body.put("timestamp", LocalDateTime.now().toString());

                objectMapper.writeValue(response.getOutputStream(), body);
        }
}