package com.ocrs.backend.service;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.AopTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.lang.reflect.Field;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest
public class ExternalServiceClientTest {

        @Autowired
        private ExternalServiceClient externalServiceClient;

        @Autowired
        private CircuitBreakerRegistry circuitBreakerRegistry;

        // Removed @MockBean for WebClient.Builder to allow real/auto-configured builder
        // to handle constructor chaining
        // @MockBean
        // private WebClient.Builder webClientBuilder;

        private WebClient webClient;
        private WebClient.RequestBodyUriSpec requestBodyUriSpec;
        private WebClient.RequestBodySpec requestBodySpec;
        private WebClient.RequestHeadersSpec requestHeadersSpec;
        private WebClient.ResponseSpec responseSpec;

        @BeforeEach
        public void setup() {
                webClient = mock(WebClient.class);
                requestBodyUriSpec = mock(WebClient.RequestBodyUriSpec.class);
                requestBodySpec = mock(WebClient.RequestBodySpec.class);
                requestHeadersSpec = mock(WebClient.RequestHeadersSpec.class);
                responseSpec = mock(WebClient.ResponseSpec.class);
        }

        @Test
        public void testEmailServiceCircuitBreaker() throws Exception {
                // Setup the fluent API chain
                when(webClient.post()).thenReturn(requestBodyUriSpec);
                when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
                when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
                when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
                // Returns Mono.error to simulate failure
                when(responseSpec.bodyToMono(Void.class))
                                .thenReturn(Mono.error(new RuntimeException("Service Unavailable")));

                // Inject the mocked WebClient into the TARGET service bean (unwrap proxy)
                // This is crucial because the service was initialized with a real/different
                // WebClient
                Object targetService = AopTestUtils.getTargetObject(externalServiceClient);
                Field webClientField = ExternalServiceClient.class.getDeclaredField("webClient");
                webClientField.setAccessible(true);
                webClientField.set(targetService, webClient);

                // Execute the method
                CompletableFuture<Void> future = externalServiceClient.sendEmailNotification(1L,
                                "test@example.com", "Test Subject", "Test Message");

                // Wait for future to complete (should complete normally due to fallback
                // returning null)
                try {
                        future.get(5, TimeUnit.SECONDS);
                } catch (Exception e) {
                        // Should not happen if fallback works
                }

                // Verify circuit breaker recorded the failure
                CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker("emailService");

                int maxRetries = 10;
                int failedCalls = 0;
                for (int i = 0; i < maxRetries; i++) {
                        failedCalls = circuitBreaker.getMetrics().getNumberOfFailedCalls();
                        if (failedCalls > 0)
                                break;
                        Thread.sleep(100);
                }

                assertEquals(1, failedCalls, "Circuit breaker should record a failure");
        }
}
