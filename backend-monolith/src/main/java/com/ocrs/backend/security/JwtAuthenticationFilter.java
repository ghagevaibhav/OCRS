package com.ocrs.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT Authentication Filter that validates JWT tokens and sets up Spring
 * Security context.
 * Uses UserPrincipal as the authentication principal for proper Spring Security
 * integration.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

        private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

        private final JwtUtils jwtUtils;

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                        HttpServletResponse response,
                        FilterChain filterChain) throws ServletException, IOException {
                try {
                        String jwt = parseJwt(request);
                        if (jwt != null && jwtUtils.validateToken(jwt)) {
                                // Parse token ONCE and extract all claims efficiently
                                JwtUtils.JwtClaims claims = jwtUtils.extractAllClaims(jwt);

                                // Create UserPrincipal from JWT claims
                                UserPrincipal principal = UserPrincipal.fromJwtClaims(
                                                claims.id(),
                                                claims.email(),
                                                claims.role());

                                // Create authentication token with UserPrincipal
                                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                                principal,
                                                null,
                                                principal.getAuthorities());

                                authentication.setDetails(
                                                new WebAuthenticationDetailsSource().buildDetails(request));
                                SecurityContextHolder.getContext().setAuthentication(authentication);

                                // Add user info to request attributes for easy access in controllers
                                request.setAttribute("userId", claims.id());
                                request.setAttribute("userEmail", claims.email());
                                request.setAttribute("userRole", claims.role());
                        }
                } catch (Exception e) {
                        logger.error("Cannot set user authentication: {}", e.getMessage());
                }

                filterChain.doFilter(request, response);
        }

        /**
         * Extract JWT token from Authorization header.
         *
         * @param request HTTP request
         * @return JWT token string or null if not found
         */
        private String parseJwt(HttpServletRequest request) {
                String headerAuth = request.getHeader("Authorization");
                if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
                        return headerAuth.substring(7);
                }
                return null;
        }
}
