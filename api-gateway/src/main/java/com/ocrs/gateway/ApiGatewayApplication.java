package com.ocrs.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

        /**
         * Application entry point that bootstraps and runs the API Gateway Spring Boot application.
         *
         * @param args command-line arguments forwarded to the Spring Boot runtime
         */
        public static void main(String[] args) {
                SpringApplication.run(ApiGatewayApplication.class, args);
        }
}