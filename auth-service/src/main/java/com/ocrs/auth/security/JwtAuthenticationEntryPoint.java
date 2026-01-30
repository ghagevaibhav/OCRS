package com.ocrs.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Custom AuthenticationEntryPoint that returns proper JSON error responses
 * for 401 Unauthorized errors.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

        private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationEntryPoint.class);
        private final ObjectMapper objectMapper;

        /**
         * Produce a standardized JSON 401 Unauthorized response and log the authentication failure.
         *
         * The response body is a JSON object with the fields: `success` (false), `message` ("Unauthorized: " + exception message),
         * `path` (request URI), and `timestamp` (current time).
         *
         * @param request the HTTP request that triggered the authentication failure
         * @param response the HTTP response to populate with the JSON error payload and status
         * @param authException the authentication exception that caused the unauthorized response
         * @throws IOException if an I/O error occurs while writing the response
         * @throws ServletException if a servlet error occurs processing the request
         */
        @Override
        public void commence(HttpServletRequest request, HttpServletResponse response,
                        AuthenticationException authException) throws IOException, ServletException {
                logger.error("Unauthorized access to {}: {}", request.getRequestURI(),
                                authException.getMessage());

                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

                Map<String, Object> body = new LinkedHashMap<>();
                body.put("success", false);
                body.put("message", "Unauthorized: " + authException.getMessage());
                body.put("path", request.getRequestURI());
                body.put("timestamp", LocalDateTime.now().toString());

                objectMapper.writeValue(response.getOutputStream(), body);
        }
}