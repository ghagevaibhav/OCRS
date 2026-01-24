package com.ocrs.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocrs.auth.dto.*;
import com.ocrs.auth.security.JwtAuthenticationFilter;
import com.ocrs.auth.security.JwtUtils;
import com.ocrs.auth.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// integration tests for auth controller endpoints
@WebMvcTest(controllers = AuthController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private AuthService authService;

        @MockBean
        private JwtUtils jwtUtils;

        @MockBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

        @Autowired
        private ObjectMapper objectMapper;

        @Test
        void registerUser_success() throws Exception {
                // arrange
                UserRegisterRequest request = new UserRegisterRequest();
                request.setEmail("test@example.com");
                request.setPassword("password123");
                request.setFullName("Test User");
                request.setPhone("1234567890");

                AuthResponse authResponse = AuthResponse.success("token123", 1L, "test@example.com", "Test User",
                                "USER");
                when(authService.registerUser(any()))
                                .thenReturn(ApiResponse.success("User registered successfully", authResponse));

                // act & assert
                mockMvc.perform(post("/api/auth/register/user")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("User registered successfully"));
        }

        @Test
        void login_success() throws Exception {
                // arrange
                LoginRequest request = new LoginRequest();
                request.setEmail("test@example.com");
                request.setPassword("password123");
                request.setRole("USER");

                AuthResponse authResponse = AuthResponse.success("token123", 1L, "test@example.com", "Test User",
                                "USER");
                when(authService.login(any())).thenReturn(ApiResponse.success("Login successful", authResponse));

                // act & assert
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.token").value("token123"));
        }

        @Test
        void login_invalidCredentials() throws Exception {
                // arrange
                LoginRequest request = new LoginRequest();
                request.setEmail("test@example.com");
                request.setPassword("wrongpassword");
                request.setRole("USER");

                when(authService.login(any())).thenReturn(ApiResponse.error("Invalid email or password"));

                // act & assert
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        void logout_success() throws Exception {
                // arrange
                when(authService.logout(anyLong(), anyString()))
                                .thenReturn(ApiResponse.success("Logged out successfully", true));

                // act & assert
                mockMvc.perform(post("/api/auth/logout")
                                .param("userId", "1")
                                .param("role", "USER"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        void health_returnsOk() throws Exception {
                // act & assert
                mockMvc.perform(get("/api/auth/health"))
                                .andExpect(status().isOk())
                                .andExpect(content().string("Auth Service is running"));
        }
}
