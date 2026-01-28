package com.ocrs.auth.service;

import com.ocrs.auth.dto.*;
import com.ocrs.auth.entity.Admin;
import com.ocrs.auth.entity.Authority;
import com.ocrs.auth.entity.RefreshToken;
import com.ocrs.auth.entity.User;
import com.ocrs.auth.exception.TokenRefreshException;
import com.ocrs.auth.repository.AdminRepository;
import com.ocrs.auth.repository.AuthorityRepository;
import com.ocrs.auth.repository.UserRepository;
import com.ocrs.auth.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

        private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

        @Value("${jwt.expiration:3600000}") // 1 hour default
        private long accessTokenExpirationMs;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private AuthorityRepository authorityRepository;

        @Autowired
        private AdminRepository adminRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Autowired
        private JwtUtils jwtUtils;

        @Autowired
        private RefreshTokenService refreshTokenService;

        @Autowired
        private LoggingClient loggingClient;

        @Transactional
        public ApiResponse<AuthResponse> registerUser(UserRegisterRequest request) {
                // check if email exists
                if (userRepository.existsByEmail(request.getEmail())) {
                        return ApiResponse.error("Email already registered");
                }

                // check if aadhaar exists (if provided)
                if (request.getAadhaarNumber() != null &&
                                userRepository.existsByAadhaarNumber(request.getAadhaarNumber())) {
                        return ApiResponse.error("Aadhaar number already registered");
                }

                // create user
                User user = User.builder()
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .fullName(request.getFullName())
                                .phone(request.getPhone())
                                .address(request.getAddress())
                                .aadhaarNumber(request.getAadhaarNumber())
                                .build();

                user = userRepository.save(user);
                logger.info("user registered: {}", user.getEmail());

                // log registration event with user details
                loggingClient.logAuthEvent("USER_REGISTERED", user.getId(), user.getEmail(),
                                user.getFullName(), user.getEmail());

                // generate tokens
                String accessToken = jwtUtils.generateToken(user.getId(), user.getEmail(), "USER");
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId(), "USER");

                AuthResponse authResponse = AuthResponse.success(
                                accessToken, refreshToken.getToken(), user.getId(), user.getEmail(),
                                user.getFullName(), "USER", accessTokenExpirationMs / 1000);

                return ApiResponse.success("User registered successfully", authResponse);
        }

        @Transactional
        public ApiResponse<AuthResponse> registerAuthority(AuthorityRegisterRequest request) {
                // check if email exists
                if (authorityRepository.existsByEmail(request.getEmail())) {
                        return ApiResponse.error("Email already registered");
                }

                // check if badge number exists
                if (authorityRepository.existsByBadgeNumber(request.getBadgeNumber())) {
                        return ApiResponse.error("Badge number already registered");
                }

                // create authority
                Authority authority = Authority.builder()
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .fullName(request.getFullName())
                                .badgeNumber(request.getBadgeNumber())
                                .designation(request.getDesignation())
                                .stationName(request.getStationName())
                                .stationAddress(request.getStationAddress())
                                .phone(request.getPhone())
                                .build();

                authority = authorityRepository.save(authority);
                logger.info("authority registered: {}", authority.getEmail());

                // log registration event with authority details
                loggingClient.logAuthEvent("AUTHORITY_REGISTERED", authority.getId(), authority.getEmail(),
                                authority.getFullName(), authority.getEmail());

                // generate tokens
                String accessToken = jwtUtils.generateToken(authority.getId(), authority.getEmail(), "AUTHORITY");
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(authority.getId(), "AUTHORITY");

                AuthResponse authResponse = AuthResponse.success(
                                accessToken, refreshToken.getToken(), authority.getId(), authority.getEmail(),
                                authority.getFullName(), "AUTHORITY", accessTokenExpirationMs / 1000);

                return ApiResponse.success("Authority registered successfully", authResponse);
        }

        public ApiResponse<AuthResponse> login(LoginRequest request) {
                String role = request.getRole().toUpperCase();

                switch (role) {
                        case "USER":
                                return loginUser(request.getEmail(), request.getPassword());
                        case "AUTHORITY":
                                return loginAuthority(request.getEmail(), request.getPassword());
                        case "ADMIN":
                                return loginAdmin(request.getEmail(), request.getPassword());
                        default:
                                return ApiResponse.error("Invalid role specified");
                }
        }

        @Transactional
        private ApiResponse<AuthResponse> loginUser(String email, String password) {
                User user = userRepository.findByEmail(email)
                                .orElse(null);

                if (user == null) {
                        return ApiResponse.error("Invalid email or password");
                }

                if (!user.getIsActive()) {
                        return ApiResponse.error("Account is deactivated");
                }

                if (!passwordEncoder.matches(password, user.getPassword())) {
                        return ApiResponse.error("Invalid email or password");
                }

                String accessToken = jwtUtils.generateToken(user.getId(), user.getEmail(), "USER");
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId(), "USER");

                AuthResponse authResponse = AuthResponse.success(
                                accessToken, refreshToken.getToken(), user.getId(), user.getEmail(),
                                user.getFullName(), "USER", accessTokenExpirationMs / 1000);

                logger.info("user logged in: {}", email);
                // log login event with user details
                loggingClient.logAuthEvent("LOGIN", user.getId(), "USER:" + email,
                                user.getFullName(), user.getEmail());

                return ApiResponse.success("Login successful", authResponse);
        }

        @Transactional
        private ApiResponse<AuthResponse> loginAuthority(String email, String password) {
                Authority authority = authorityRepository.findByEmail(email)
                                .orElse(null);

                if (authority == null) {
                        return ApiResponse.error("Invalid email or password");
                }

                if (!authority.getIsActive()) {
                        return ApiResponse.error("Account is deactivated");
                }

                if (!passwordEncoder.matches(password, authority.getPassword())) {
                        return ApiResponse.error("Invalid email or password");
                }

                String accessToken = jwtUtils.generateToken(authority.getId(), authority.getEmail(), "AUTHORITY");
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(authority.getId(), "AUTHORITY");

                AuthResponse authResponse = AuthResponse.success(
                                accessToken, refreshToken.getToken(), authority.getId(), authority.getEmail(),
                                authority.getFullName(), "AUTHORITY", accessTokenExpirationMs / 1000);

                logger.info("authority logged in: {}", email);
                // log login event with authority details
                loggingClient.logAuthEvent("LOGIN", authority.getId(), "AUTHORITY:" + email,
                                authority.getFullName(), authority.getEmail());

                return ApiResponse.success("Login successful", authResponse);
        }

        @Transactional
        private ApiResponse<AuthResponse> loginAdmin(String email, String password) {
                Admin admin = adminRepository.findByEmail(email)
                                .orElse(null);

                if (admin == null) {
                        return ApiResponse.error("Invalid email or password");
                }

                if (!admin.getIsActive()) {
                        return ApiResponse.error("Account is deactivated");
                }

                if (!passwordEncoder.matches(password, admin.getPassword())) {
                        return ApiResponse.error("Invalid email or password");
                }

                String accessToken = jwtUtils.generateToken(admin.getId(), admin.getEmail(), "ADMIN");
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(admin.getId(), "ADMIN");

                AuthResponse authResponse = AuthResponse.success(
                                accessToken, refreshToken.getToken(), admin.getId(), admin.getEmail(),
                                admin.getFullName(), "ADMIN", accessTokenExpirationMs / 1000);

                logger.info("admin logged in: {}", email);
                // log login event with admin details
                loggingClient.logAuthEvent("ADMIN_LOGIN", admin.getId(), "ADMIN:" + email,
                                admin.getFullName(), admin.getEmail());

                return ApiResponse.success("Login successful", authResponse);
        }

        /**
         * Refresh access token using a valid refresh token.
         */
        @Transactional
        public ApiResponse<AuthResponse> refreshToken(String refreshTokenStr) {
                try {
                        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenStr)
                                        .orElseThrow(() -> new TokenRefreshException(refreshTokenStr,
                                                        "Refresh token not found"));

                        refreshToken = refreshTokenService.verifyExpiration(refreshToken);

                        Long userId = refreshToken.getUserId();
                        String role = refreshToken.getUserRole();

                        // Get user details based on role
                        String email = null;
                        String fullName = null;

                        switch (role) {
                                case "USER":
                                        User user = userRepository.findById(userId).orElse(null);
                                        if (user != null) {
                                                email = user.getEmail();
                                                fullName = user.getFullName();
                                        }
                                        break;
                                case "AUTHORITY":
                                        Authority authority = authorityRepository.findById(userId).orElse(null);
                                        if (authority != null) {
                                                email = authority.getEmail();
                                                fullName = authority.getFullName();
                                        }
                                        break;
                                case "ADMIN":
                                        Admin admin = adminRepository.findById(userId).orElse(null);
                                        if (admin != null) {
                                                email = admin.getEmail();
                                                fullName = admin.getFullName();
                                        }
                                        break;
                        }

                        if (email == null) {
                                return ApiResponse.error("User not found");
                        }

                        // Generate new access token
                        String newAccessToken = jwtUtils.generateToken(userId, email, role);

                        // Create new refresh token (rotating refresh tokens for security)
                        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(userId, role);

                        AuthResponse authResponse = AuthResponse.success(
                                        newAccessToken, newRefreshToken.getToken(), userId, email,
                                        fullName, role, accessTokenExpirationMs / 1000);

                        logger.info("Token refreshed for {} with role {}", email, role);
                        return ApiResponse.success("Token refreshed successfully", authResponse);

                } catch (TokenRefreshException e) {
                        logger.warn("Token refresh failed: {}", e.getMessage());
                        return ApiResponse.error(e.getMessage());
                }
        }

        /**
         * Revoke a specific refresh token.
         */
        @Transactional
        public ApiResponse<Boolean> revokeRefreshToken(String refreshToken) {
                refreshTokenService.revokeToken(refreshToken);
                return ApiResponse.success("Token revoked successfully", true);
        }

        // logout endpoint - logs the logout event and revokes refresh tokens
        @Transactional
        public ApiResponse<Boolean> logout(Long userId, String role) {
                // Revoke all refresh tokens for this user/role
                refreshTokenService.revokeAllUserTokens(userId, role);

                logger.info("{} logged out: userId={}", role, userId);
                loggingClient.logAuthEvent("LOGOUT", userId, role + ":" + userId);
                return ApiResponse.success("Logged out successfully", true);
        }

        public ApiResponse<Boolean> validateToken(String token) {
                if (jwtUtils.validateToken(token)) {
                        return ApiResponse.success("Token is valid", true);
                }
                return ApiResponse.error("Invalid or expired token");
        }

        public ApiResponse<AuthorityDTO> updateAuthority(Long id, AuthorityDTO request) {
                Authority authority = authorityRepository.findById(id).orElse(null);
                if (authority == null) {
                        return ApiResponse.error("Authority not found");
                }

                if (request.getFullName() != null)
                        authority.setFullName(request.getFullName());
                if (request.getBadgeNumber() != null)
                        authority.setBadgeNumber(request.getBadgeNumber());
                if (request.getDesignation() != null)
                        authority.setDesignation(request.getDesignation());
                if (request.getStationName() != null)
                        authority.setStationName(request.getStationName());
                if (request.getStationAddress() != null)
                        authority.setStationAddress(request.getStationAddress());
                if (request.getPhone() != null)
                        authority.setPhone(request.getPhone());

                authority = authorityRepository.save(authority);
                loggingClient.logAuthEvent("AUTHORITY_UPDATED", authority.getId(), authority.getEmail());

                return ApiResponse.success("Authority updated successfully", mapToAuthorityDTO(authority));
        }

        public ApiResponse<Boolean> deleteAuthority(Long id) {
                Authority authority = authorityRepository.findById(id).orElse(null);
                if (authority == null) {
                        return ApiResponse.error("Authority not found");
                }

                authority.setIsActive(false);
                authorityRepository.save(authority);
                loggingClient.logAuthEvent("AUTHORITY_DELETED", authority.getId(), authority.getEmail());

                return ApiResponse.success("Authority deactivated successfully", true);
        }

        private AuthorityDTO mapToAuthorityDTO(Authority authority) {
                return AuthorityDTO.builder()
                                .id(authority.getId())
                                .email(authority.getEmail())
                                .fullName(authority.getFullName())
                                .badgeNumber(authority.getBadgeNumber())
                                .designation(authority.getDesignation())
                                .stationName(authority.getStationName())
                                .stationAddress(authority.getStationAddress())
                                .phone(authority.getPhone())
                                .isActive(authority.getIsActive())
                                .build();
        }
}
