package com.ocrs.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

// enables async processing for external service calls and jpa auditing for timestamps
@SpringBootApplication
@EnableAsync
@EnableJpaAuditing
public class BackendMonolithApplication {

        public static void main(String[] args) {
                SpringApplication.run(BackendMonolithApplication.class, args);
        }
}
