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

        /**
         * Create a UserPrincipal with the provided id, email, and role and set its granted authorities to a single `SimpleGrantedAuthority` named `"ROLE_<role>"`.
         *
         * @param id the user's identifier
         * @param email the user's email (used as the username)
         * @param role the user's role (also exposed as the granted authority, prefixed with `ROLE_`)
         */
        public UserPrincipal(Long id, String email, String role) {
                this.id = id;
                this.email = email;
                this.role = role;
                this.authorities = Collections.singletonList(
                                new SimpleGrantedAuthority("ROLE_" + role));
        }

        /**
         * Get the user's email to be used as the username for authentication.
         *
         * @return the user's email used as the username
         */
        @Override
        public String getUsername() {
                return email;
        }

        /**
         * Exposes the user's password credential to the authentication framework.
         *
         * @return {@code null} because JWT-based authentication does not use a stored password.
         */
        @Override
        public String getPassword() {
                return null; // Password not needed for JWT authentication
        }

        /**
         * Returns the granted authorities representing this user's roles and permissions.
         *
         * @return the collection of granted authorities assigned to the principal (for this implementation typically a single {@code SimpleGrantedAuthority} with {@code ROLE_<role>}).
         */
        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
                return authorities;
        }

        /**
         * Indicates whether the user's account has not expired.
         *
         * <p>This implementation treats accounts as never expired.</p>
         *
         * @return Always `true` since accounts are not considered expired.
         */
        @Override
        public boolean isAccountNonExpired() {
                return true;
        }

        /**
         * Indicates whether the user's account is not locked.
         *
         * @return `true` if the account is not locked, `false` otherwise.
         */
        @Override
        public boolean isAccountNonLocked() {
                return true;
        }

        /**
         * Indicates whether the user's credentials are valid and not expired.
         *
         * <p>This implementation always returns {@code true} because credential expiration is not tracked for JWT-based authentication.</p>
         *
         * @return {@code true} if the user's credentials are valid (not expired), {@code false} otherwise.
         */
        @Override
        public boolean isCredentialsNonExpired() {
                return true;
        }

        /**
         * Indicates whether the user is enabled.
         *
         * <p>For this principal (JWT-based authentication), the account is always considered enabled.</p>
         *
         * @return `true` if the user is enabled, `false` otherwise
         */
        @Override
        public boolean isEnabled() {
                return true;
        }

        /**
         * Create a UserPrincipal populated from JWT claim values.
         *
         * @param id    the user's identifier from the JWT claims
         * @param email the user's email from the JWT claims; used as the principal username
         * @param role  the user's role from the JWT claims
         * @return      a new UserPrincipal representing the user described by the provided JWT claims
         */
        public static UserPrincipal fromJwtClaims(Long id, String email, String role) {
                return new UserPrincipal(id, email, role);
        }
}