package com.ocrs.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

/**
 * Rate limiting configuration for API Gateway.
 * Uses IP-based rate limiting by default.
 */
@Configuration
public class RateLimitConfig {

        /**
         * Key resolver that uses client IP address for rate limiting.
         * Falls back to "anonymous" if IP cannot be determined.
         * Marked as @Primary to be the default KeyResolver for rate limiting.
         */
        @Bean
        @Primary
        public KeyResolver ipKeyResolver() {
                return exchange -> {
                        String clientIp = exchange.getRequest().getRemoteAddress() != null
                                        ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                                        : "anonymous";
                        return Mono.just(clientIp);
                };
        }

        /**
         * Alternative key resolver that uses user ID from JWT token.
         *term
          Useful for user-based rate limiting on authenticated routes.
         */
        @Bean
        public KeyResolver userKeyResolver() {
                return exchange -> {
                        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
                        return Mono.just(userId != null ? userId : "anonymous");
                };
        }
}
