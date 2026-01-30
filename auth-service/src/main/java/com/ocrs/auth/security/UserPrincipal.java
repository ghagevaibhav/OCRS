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

        /**
         * Constructs a UserPrincipal with the given identity, credentials, display name, role, and active flag and initializes authorities to a single `SimpleGrantedAuthority` named `"ROLE_" + role`.
         *
         * @param id the user's unique identifier
         * @param email the user's email used as the username
         * @param password the user's password (may be null for principals created from JWT claims)
         * @param fullName the user's display name, or null if not available
         * @param role the role name (e.g. "ADMIN", "USER"); used to build the granted authority
         * @param active whether the account is active; controls account-locked and enabled state
         */
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

        /**
         * Provide the principal's username used for authentication.
         *
         * @return the principal's username, derived from the email field
         */
        @Override
        public String getUsername() {
                return email;
        }

        /**
         * Gets the principal's password used for authentication.
         *
         * @return the password, or {@code null} if no password is associated with this principal
         */
        @Override
        public String getPassword() {
                return password;
        }

        /**
         * Exposes the granted authorities associated with this principal.
         *
         * @return the collection of granted authorities for the principal
         */
        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
                return authorities;
        }

        /**
         * Indicates whether the user's account has not expired.
         *
         * @return {@code true} if the account is not expired, {@code false} otherwise.
         */
        @Override
        public boolean isAccountNonExpired() {
                return true;
        }

        /**
         * Indicates whether the account is not locked.
         *
         * @return true if the account is not locked (i.e., the principal is active), false otherwise.
         */
        @Override
        public boolean isAccountNonLocked() {
                return active;
        }

        /**
         * Indicates whether the user's credentials have not expired; this implementation always treats credentials as not expired.
         *
         * @return Always `true`.
         */
        @Override
        public boolean isCredentialsNonExpired() {
                return true;
        }

        /**
         * Indicates whether the user account is enabled.
         *
         * @return `true` if the user is enabled, `false` otherwise.
         */
        @Override
        public boolean isEnabled() {
                return active;
        }

        /**
         * Create a UserPrincipal representing a regular user from a User entity.
         *
         * @param user the User entity whose id, email, password, full name, and active flag will populate the principal
         * @return a UserPrincipal with role "USER" populated from the given user's data
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
         * Create a UserPrincipal representing the given Admin.
         *
         * @param admin the Admin entity to convert into a UserPrincipal
         * @return a UserPrincipal populated with the admin's id, email, password, fullName, role set to "ADMIN", and active flag from the admin
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
         * Create a UserPrincipal representing a user described by JWT claims.
         *
         * @param id the user identifier from the JWT claims (may be null)
         * @param email the user's email from the JWT claims
         * @param role the user's role name from the JWT claims (without the "ROLE_" prefix)
         * @return a UserPrincipal populated with the given id, email, and role; password and fullName are null and the principal is active
         */
        public static UserPrincipal fromJwtClaims(Long id, String email, String role) {
                return new UserPrincipal(id, email, null, null, role, true);
        }
}