package com.ocrs.backend.security;

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
         * Send a JSON 401 Unauthorized response containing an error message, request path, and timestamp when authentication fails.
         *
         * @param request the HTTP request that triggered the authentication failure
         * @param response the HTTP response to write the JSON error payload to
         * @param authException the authentication failure that caused this entry point to be invoked
         * @throws IOException if writing the JSON payload to the response output stream fails
         * @throws ServletException if an error occurs while handling the servlet request
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