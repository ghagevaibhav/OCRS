package com.ocrs.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Main application class for the Backend Service.
 * Enables:
 * - Async processing for external service calls
 * - JPA auditing for timestamps
 * - Feign clients for service-to-service communication
 */
@SpringBootApplication
@EnableAsync
@EnableJpaAuditing
@EnableFeignClients
public class BackendMonolithApplication {

        public static void main(String[] args) {
                SpringApplication.run(BackendMonolithApplication.class, args);
        }
}
