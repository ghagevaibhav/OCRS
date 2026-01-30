package com.ocrs.backend.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Custom UserDetails implementation that encapsulates user information from
 * JWT.
 * Used as the authentication principal in Spring Security context.
 */
@Getter
public class UserPrincipal implements UserDetails {

        private final Long id;
        private final String email;
        private final String role;
        private final Collection<? extends GrantedAuthority> authorities;

        public UserPrincipal(Long id, String email, String role) {
                this.id = id;
                this.email = email;
                this.role = role;
                this.authorities = Collections.singletonList(
                                new SimpleGrantedAuthority("ROLE_" + role));
        }

        @Override
        public String getUsername() {
                return email;
        }

        @Override
        public String getPassword() {
                return null; // Password not needed for JWT authentication
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
                return authorities;
        }

        @Override
        public boolean isAccountNonExpired() {
                return true;
        }

        @Override
        public boolean isAccountNonLocked() {
                return true;
        }

        @Override
        public boolean isCredentialsNonExpired() {
                return true;
        }

        @Override
        public boolean isEnabled() {
                return true;
        }

        /**
         * Factory method to create UserPrincipal from JWT claims.
         */
        public static UserPrincipal fromJwtClaims(Long id, String email, String role) {
                return new UserPrincipal(id, email, role);
        }
}
