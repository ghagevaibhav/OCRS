package com.ocrs.backend.config;

import com.ocrs.backend.security.CustomAccessDeniedHandler;
import com.ocrs.backend.security.GatewayAuthFilter;
import com.ocrs.backend.security.JwtAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security configuration for backend-monolith.
 * 
 * Trusts API Gateway for authentication - gateway validates JWT and forwards
 * user info via X-User-* headers. This service reads those headers via
 * GatewayAuthFilter to set up SecurityContext for @PreAuthorize annotations.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true, prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

        private final GatewayAuthFilter gatewayAuthFilter;
        private final JwtAuthenticationEntryPoint authEntryPoint;
        private final CustomAccessDeniedHandler accessDeniedHandler;

        @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:3001}")
        private List<String> allowedOrigins;

        @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
        private List<String> allowedMethods;

        /**
         * BCrypt password encoder with strength 12 for secure password hashing.
         */
        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(12);
        }

        /**
         * Main security filter chain configuration.
         * Uses GatewayAuthFilter to read trusted headers from API Gateway.
         */
        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                return http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint(authEntryPoint)
                                                .accessDeniedHandler(accessDeniedHandler))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/actuator/**").permitAll()
                                                .requestMatchers("/api/health").permitAll()
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                // user endpoints
                                                .requestMatchers("/api/user/**").hasRole("USER")
                                                // authority endpoints
                                                .requestMatchers("/api/authority/**").hasRole("AUTHORITY")
                                                // admin endpoints
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .anyRequest().authenticated())
                                .addFilterBefore(gatewayAuthFilter, UsernamePasswordAuthenticationFilter.class)
                                .headers(headers -> headers
                                                .frameOptions(frame -> frame.deny())
                                                .contentTypeOptions(content -> {
                                                })
                                                .xssProtection(xss -> xss.disable()))
                                .build();
        }

        /**
         * CORS configuration with externalized allowed origins.
         */
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(allowedOrigins);
                configuration.setAllowedMethods(allowedMethods);
                configuration.setAllowedHeaders(List.of(
                                "Authorization",
                                "Content-Type",
                                "X-Requested-With",
                                "Accept",
                                "Origin",
                                "X-User-Id",
                                "X-User-Email",
                                "X-User-Role"));
                configuration.setExposedHeaders(List.of("Authorization"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
