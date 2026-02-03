package com.ocrs.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Simplified Spring Security configuration for auth-service.
 * 
 * Note: JWT validation is handled by the API Gateway. Auth-service endpoints
 * are either public (/api/auth/**) or internal (/api/internal/**), so no
 * request-level authentication is needed here.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

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
         * Simplified security filter chain - permits all requests.
         * Authentication is handled by API Gateway before requests reach this service.
         */
        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                return http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .anyRequest().permitAll())
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
                                "Origin"));
                configuration.setExposedHeaders(List.of("Authorization"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}