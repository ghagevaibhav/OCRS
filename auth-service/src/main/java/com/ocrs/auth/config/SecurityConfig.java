package com.ocrs.auth.config;

import com.ocrs.auth.security.CustomAccessDeniedHandler;
import com.ocrs.auth.security.CustomUserDetailsService;
import com.ocrs.auth.security.JwtAuthenticationEntryPoint;
import com.ocrs.auth.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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
 * Spring Security configuration for auth-service.
 * Implements JWT-based stateless authentication with proper error handling.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthFilter;
        private final CustomUserDetailsService userDetailsService;
        private final JwtAuthenticationEntryPoint authEntryPoint;
        private final CustomAccessDeniedHandler accessDeniedHandler;

        @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:3001}")
        private List<String> allowedOrigins;

        @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
        private List<String> allowedMethods;

        /**
         * Create a BCrypt PasswordEncoder configured with strength 12 for hashing passwords.
         *
         * @return a PasswordEncoder that uses BCrypt with strength 12; compatible with passwords encoded using the default BCrypt strength
         */
        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(12);
        }

        /**
         * Creates a DaoAuthenticationProvider configured with the application's UserDetailsService and PasswordEncoder.
         *
         * @return a DaoAuthenticationProvider configured with the application's UserDetailsService and PasswordEncoder
         */
        @Bean
        public DaoAuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
                provider.setUserDetailsService(userDetailsService);
                provider.setPasswordEncoder(passwordEncoder());
                return provider;
        }

        /**
         * Exposes the AuthenticationManager from the provided AuthenticationConfiguration for programmatic authentication.
         *
         * @param config the AuthenticationConfiguration to obtain the AuthenticationManager from
         * @return the configured AuthenticationManager
         * @throws Exception if the AuthenticationManager cannot be obtained
         */
        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        /**
         * Configure the application's security filter chain.
         *
         * Configures CORS, disables CSRF, enforces stateless session management, sets exception
         * handling and header policies, permits unauthenticated access to authentication, internal,
         * admin authorities, and actuator endpoints, requires authentication for all other requests,
         * registers the authentication provider and JWT authentication filter.
         *
         * @return the configured SecurityFilterChain
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
                                                .requestMatchers("/api/auth/**").permitAll()
                                                .requestMatchers("/api/internal/**").permitAll()
                                                .requestMatchers("/api/admin/authorities/**").permitAll()
                                                .requestMatchers("/actuator/**").permitAll()
                                                .anyRequest().authenticated())
                                .authenticationProvider(authenticationProvider())
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                                .headers(headers -> headers
                                                .frameOptions(frame -> frame.deny())
                                                .contentTypeOptions(content -> {
                                                })
                                                .xssProtection(xss -> xss.disable()))
                                .build();
        }

        /**
         * Create a CorsConfigurationSource that applies CORS settings (allowed origins, methods,
         * headers, exposed headers, credentials, and max age) to all request paths.
         *
         * @return the configured CorsConfigurationSource registered for all paths ("/**")
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