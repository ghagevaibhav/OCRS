package com.ocrs.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Gateway Authentication Filter that trusts headers set by API Gateway.
 * 
 * The API Gateway validates JWT tokens and forwards authenticated requests
 * with X-User-Id, X-User-Email, and X-User-Role headers. This filter:
 * 1. Validates the gateway shared secret (if configured)
 * 2. Reads trusted user headers
 * 3. Sets up Spring Security context for @PreAuthorize annotations
 * 4. Sets request attributes for controller access
 * 
 * This approach eliminates redundant JWT validation in the backend service.
 */
@Component
public class GatewayAuthFilter extends OncePerRequestFilter {

        private static final Logger logger = LoggerFactory.getLogger(GatewayAuthFilter.class);

        private static final String HEADER_USER_ID = "X-User-Id";
        private static final String HEADER_USER_EMAIL = "X-User-Email";
        private static final String HEADER_USER_ROLE = "X-User-Role";
        private static final String HEADER_GATEWAY_SECRET = "X-Gateway-Secret";

        @Value("${gateway.shared-secret:}")
        private String expectedSecret;

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                        HttpServletResponse response,
                        FilterChain filterChain) throws ServletException, IOException {

                String path = request.getRequestURI();

                // skip secret validation for actuator/health endpoints
                if (path.startsWith("/actuator") || path.equals("/api/health")) {
                        filterChain.doFilter(request, response);
                        return;
                }

                // validate gateway secret if configured (defense in depth)
                if (StringUtils.hasText(expectedSecret)) {
                        String gatewaySecret = request.getHeader(HEADER_GATEWAY_SECRET);
                        if (!expectedSecret.equals(gatewaySecret)) {
                                logger.warn("Rejected request to {} - invalid or missing gateway secret", path);
                                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                response.setContentType("application/json");
                                response.getWriter()
                                                .write("{\"success\":false,\"message\":\"Direct access forbidden\"}");
                                return;
                        }
                }

                try {
                        String userIdHeader = request.getHeader(HEADER_USER_ID);
                        String userEmail = request.getHeader(HEADER_USER_EMAIL);
                        String userRole = request.getHeader(HEADER_USER_ROLE);

                        // only set up authentication if gateway forwarded user info
                        if (StringUtils.hasText(userIdHeader) && StringUtils.hasText(userRole)) {
                                Long userId = Long.parseLong(userIdHeader);

                                // create authority with ROLE_ prefix for Spring Security
                                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + userRole);

                                // create authentication token
                                // principal is the email, credentials are null (already authenticated by
                                // gateway)
                                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                                userEmail,
                                                null,
                                                Collections.singletonList(authority));

                                authentication.setDetails(
                                                new WebAuthenticationDetailsSource().buildDetails(request));

                                // set security context for @PreAuthorize annotations
                                SecurityContextHolder.getContext().setAuthentication(authentication);

                                // set request attributes for controller access via request.getAttribute()
                                request.setAttribute("userId", userId);
                                request.setAttribute("userEmail", userEmail);
                                request.setAttribute("userRole", userRole);

                                logger.debug("Authenticated user {} with role {} from gateway headers",
                                                userEmail, userRole);
                        }
                } catch (NumberFormatException e) {
                        logger.error("Invalid user ID header format: {}", e.getMessage());
                } catch (Exception e) {
                        logger.error("Error processing gateway auth headers: {}", e.getMessage());
                }

                filterChain.doFilter(request, response);
        }
}
