package com.ocrs.auth.security;

import com.ocrs.auth.repository.AdminRepository;
import com.ocrs.auth.repository.AuthorityRepository;
import com.ocrs.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Custom UserDetailsService implementation that supports multiple user types.
 * Searches across User, Authority, and Admin repositories.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

        private final UserRepository userRepository;
        private final AuthorityRepository authorityRepository;
        private final AdminRepository adminRepository;

        /**
         * Load user by email (searches all repositories).
         * Priority: User -> Authority -> Admin
         */
        @Override
        public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
                return userRepository.findByEmail(email)
                                .map(UserPrincipal::fromUser)
                                .or(() -> authorityRepository.findByEmail(email)
                                                .map(UserPrincipal::fromAuthority))
                                .or(() -> adminRepository.findByEmail(email)
                                                .map(UserPrincipal::fromAdmin))
                                .orElseThrow(() -> new UsernameNotFoundException(
                                                "User not found with email: " + email));
        }

        /**
         * Load user by email and expected role (more efficient for login).
         * Directly queries the appropriate repository based on role.
         *
         * @param email User's email
         * @param role  Expected role (USER, AUTHORITY, ADMIN)
         * @return UserDetails for the user
         * @throws UsernameNotFoundException if user not found
         */
        
        public UserDetails loadUserByEmailAndRole(String email, String role)
                        throws UsernameNotFoundException {
                return switch (role.toUpperCase()) {
                        case "USER" -> userRepository.findByEmail(email)
                                        .map(UserPrincipal::fromUser)
                                        .orElseThrow(() -> new UsernameNotFoundException(
                                                        "User not found with email: " + email));
                        case "AUTHORITY" -> authorityRepository.findByEmail(email)
                                        .map(UserPrincipal::fromAuthority)
                                        .orElseThrow(() -> new UsernameNotFoundException(
                                                        "Authority not found with email: " + email));
                        case "ADMIN" -> adminRepository.findByEmail(email)
                                        .map(UserPrincipal::fromAdmin)
                                        .orElseThrow(() -> new UsernameNotFoundException(
                                                        "Admin not found with email: " + email));
                        default -> throw new UsernameNotFoundException("Invalid role: " + role);
                };
        }
}
