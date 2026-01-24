package com.ocrs.auth.service;

import com.ocrs.auth.dto.*;
import com.ocrs.auth.entity.User;
import com.ocrs.auth.repository.AdminRepository;
import com.ocrs.auth.repository.AuthorityRepository;
import com.ocrs.auth.repository.UserRepository;
import com.ocrs.auth.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

// unit tests for auth service
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

        @Mock
        private UserRepository userRepository;

        @Mock
        private AuthorityRepository authorityRepository;

        @Mock
        private AdminRepository adminRepository;

        @Mock
        private PasswordEncoder passwordEncoder;

        @Mock
        private JwtUtils jwtUtils;

        @Mock
        private LoggingClient loggingClient;

        @InjectMocks
        private AuthService authService;

        private UserRegisterRequest userRegisterRequest;
        private LoginRequest loginRequest;
        private User testUser;

        @BeforeEach
        void setUp() {
                // setup test user registration request
                userRegisterRequest = new UserRegisterRequest();
                userRegisterRequest.setEmail("test@example.com");
                userRegisterRequest.setPassword("password123");
                userRegisterRequest.setFullName("Test User");
                userRegisterRequest.setPhone("1234567890");

                // setup test login request
                loginRequest = new LoginRequest();
                loginRequest.setEmail("test@example.com");
                loginRequest.setPassword("password123");
                loginRequest.setRole("USER");

                // setup test user entity
                testUser = User.builder()
                                .id(1L)
                                .email("test@example.com")
                                .password("encodedPassword")
                                .fullName("Test User")
                                .isActive(true)
                                .build();
        }

        @Test
        void registerUser_success() {
                // arrange
                when(userRepository.existsByEmail(anyString())).thenReturn(false);
                when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
                when(userRepository.save(any(User.class))).thenReturn(testUser);
                when(jwtUtils.generateToken(anyLong(), anyString(), anyString())).thenReturn("testToken");

                // act
                ApiResponse<AuthResponse> response = authService.registerUser(userRegisterRequest);

                // assert
                assertTrue(response.isSuccess());
                assertEquals("User registered successfully", response.getMessage());
                assertNotNull(response.getData());
                assertEquals("testToken", response.getData().getToken());
                verify(loggingClient).logAuthEvent(eq("USER_REGISTERED"), anyLong(), anyString(), anyString(),
                                anyString());
        }

        @Test
        void registerUser_emailAlreadyExists() {
                // arrange
                when(userRepository.existsByEmail(anyString())).thenReturn(true);

                // act
                ApiResponse<AuthResponse> response = authService.registerUser(userRegisterRequest);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Email already registered", response.getMessage());
        }

        @Test
        void login_userSuccess() {
                // arrange
                when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
                when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
                when(jwtUtils.generateToken(anyLong(), anyString(), anyString())).thenReturn("testToken");

                // act
                ApiResponse<AuthResponse> response = authService.login(loginRequest);

                // assert
                assertTrue(response.isSuccess());
                assertEquals("Login successful", response.getMessage());
                assertNotNull(response.getData());
                verify(loggingClient).logAuthEvent(eq("LOGIN"), anyLong(), contains("USER:"), anyString(), anyString());
        }

        @Test
        void login_invalidPassword() {
                // arrange
                when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
                when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

                // act
                ApiResponse<AuthResponse> response = authService.login(loginRequest);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Invalid email or password", response.getMessage());
        }

        @Test
        void login_deactivatedAccount() {
                // arrange
                testUser.setIsActive(false);
                when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));

                // act
                ApiResponse<AuthResponse> response = authService.login(loginRequest);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Account is deactivated", response.getMessage());
        }

        @Test
        void logout_success() {
                // act
                ApiResponse<Boolean> response = authService.logout(1L, "USER");

                // assert
                assertTrue(response.isSuccess());
                assertEquals("Logged out successfully", response.getMessage());
                verify(loggingClient).logAuthEvent(eq("LOGOUT"), eq(1L), anyString());
        }

        @Test
        void validateToken_valid() {
                // arrange
                when(jwtUtils.validateToken(anyString())).thenReturn(true);

                // act
                ApiResponse<Boolean> response = authService.validateToken("validToken");

                // assert
                assertTrue(response.isSuccess());
                assertTrue(response.getData());
        }

        @Test
        void validateToken_invalid() {
                // arrange
                when(jwtUtils.validateToken(anyString())).thenReturn(false);

                // act
                ApiResponse<Boolean> response = authService.validateToken("invalidToken");

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Invalid or expired token", response.getMessage());
        }
}
