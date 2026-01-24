package com.ocrs.auth.config;

import com.ocrs.auth.entity.Admin;
import com.ocrs.auth.entity.Authority;
import com.ocrs.auth.entity.User;
import com.ocrs.auth.repository.AdminRepository;
import com.ocrs.auth.repository.AuthorityRepository;
import com.ocrs.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

        private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

        @Bean
        public CommandLineRunner seedData(UserRepository userRepository,
                        AuthorityRepository authorityRepository,
                        AdminRepository adminRepository,
                        PasswordEncoder passwordEncoder) {
                return args -> {
                        logger.info("Initializing Data Seeder...");

                        // Seed Admin
                        // Seed Admin
                        if (!adminRepository.findByEmail("admin@ocrs.gov.in").isPresent()) {
                                Admin admin = Admin.builder()
                                                .email("admin@ocrs.gov.in")
                                                .password(passwordEncoder.encode("Admin@123"))
                                                .fullName("System Administrator")
                                                .role("SUPER_ADMIN")
                                                .isActive(true)
                                                .build();
                                adminRepository.save(admin);
                                logger.info("Seeded Admin: admin@ocrs.gov.in / Admin@123");
                        }

                        // Seed Authority
                        if (!authorityRepository.findByEmail("officer@ocrs.com").isPresent()) {
                                Authority authority = Authority.builder()
                                                .email("officer@ocrs.com")
                                                .password(passwordEncoder.encode("Officer@123"))
                                                .fullName("Officer John Doe")
                                                .badgeNumber("BADGE123")
                                                .designation("Senior Inspector")
                                                .stationName("Central Station")
                                                .stationAddress("123 Main St, City")
                                                .phone("9876543210")
                                                .isActive(true)
                                                .build();
                                authorityRepository.save(authority);
                                logger.info("Seeded Authority: officer@ocrs.com / Officer@123");
                        }

                        // Seed User
                        if (!userRepository.findByEmail("user@ocrs.com").isPresent()) {
                                User user = User.builder()
                                                .email("user@ocrs.com")
                                                .password(passwordEncoder.encode("User@123"))
                                                .fullName("John Citizen")
                                                .phone("9988776655")
                                                .aadhaarNumber("123412341234")
                                                .isActive(true)
                                                .build();
                                userRepository.save(user);
                                logger.info("Seeded User: user@ocrs.com / User@123");
                        }

                        logger.info("Data Seeding Completed.");
                };
        }
}
