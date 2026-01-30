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
         * Resolves a rate-limiting key based on the client's IP address.
         *
         * @return the client's IP address if available, "anonymous" otherwise
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
         * Resolves a rate-limiting key from the request's "X-User-Id" header.
         *
         * @return the user id from the "X-User-Id" header, or "anonymous" if the header is absent
         */
        @Bean
        public KeyResolver userKeyResolver() {
                return exchange -> {
                        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
                        return Mono.just(userId != null ? userId : "anonymous");
                };
        }
}