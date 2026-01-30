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
         * Locate a user principal by email, searching repositories in this order: User, Authority, Admin.
         *
         * @return the corresponding UserDetails representing the found principal
         * @throws UsernameNotFoundException if no matching user is found for the given email
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
         * Load a UserDetails by email using the specified role.
         *
         * @param email the email address of the account to load
         * @param role  expected role name to select the repository; one of "USER", "AUTHORITY", or "ADMIN"
         * @return the UserDetails for the located account
         * @throws UsernameNotFoundException if no account is found for the email in the chosen role or if the role is invalid
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