package com.ocrs.auth.security;

import com.ocrs.auth.entity.Admin;
import com.ocrs.auth.entity.Authority;
import com.ocrs.auth.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Custom UserDetails implementation that encapsulates user information.
 * Works with User, Authority, and Admin entities.
 */
@Getter
public class UserPrincipal implements UserDetails {

        private final Long id;
        private final String email;
        private final String password;
        private final String fullName;
        private final String role;
        private final boolean active;
        private final Collection<? extends GrantedAuthority> authorities;

        public UserPrincipal(Long id, String email, String password, String fullName,
                        String role, boolean active) {
                this.id = id;
                this.email = email;
                this.password = password;
                this.fullName = fullName;
                this.role = role;
                this.active = active;
                this.authorities = Collections.singletonList(
                                new SimpleGrantedAuthority("ROLE_" + role));
        }

        @Override
        public String getUsername() {
                return email;
        }

        @Override
        public String getPassword() {
                return password;
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
                return active;
        }

        @Override
        public boolean isCredentialsNonExpired() {
                return true;
        }

        @Override
        public boolean isEnabled() {
                return active;
        }

        /**
         * Factory method to create UserPrincipal from User entity.
         */
        public static UserPrincipal fromUser(User user) {
                return new UserPrincipal(
                                user.getId(),
                                user.getEmail(),
                                user.getPassword(),
                                user.getFullName(),
                                "USER",
                                user.getIsActive());
        }

        /**
         * Factory method to create UserPrincipal from Authority entity.
         */
        public static UserPrincipal fromAuthority(Authority authority) {
                return new UserPrincipal(
                                authority.getId(),
                                authority.getEmail(),
                                authority.getPassword(),
                                authority.getFullName(),
                                "AUTHORITY",
                                authority.getIsActive());
        }

        /**
         * Factory method to create UserPrincipal from Admin entity.
         */
        public static UserPrincipal fromAdmin(Admin admin) {
                return new UserPrincipal(
                                admin.getId(),
                                admin.getEmail(),
                                admin.getPassword(),
                                admin.getFullName(),
                                "ADMIN",
                                admin.getIsActive());
        }

        /**
         * Factory method to create UserPrincipal from JWT claims (no password needed).
         */
        public static UserPrincipal fromJwtClaims(Long id, String email, String role) {
                return new UserPrincipal(id, email, null, null, role, true);
        }
}
