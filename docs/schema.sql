-- OCRS Database Schema
-- Online Crime Reporting System

-- Use the database
CREATE DATABASE IF NOT EXISTS project;
USE project;

-- =============================================
-- USERS TABLE (Citizens filing reports)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    aadhaar_number VARCHAR(12) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_users_email (email),
    INDEX idx_users_aadhaar (aadhaar_number)
);

-- =============================================
-- AUTHORITIES TABLE (Police officers)
-- =============================================
CREATE TABLE IF NOT EXISTS authorities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    badge_number VARCHAR(50) UNIQUE,
    designation VARCHAR(100),
    station_name VARCHAR(255),
    station_address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_authorities_email (email),
    INDEX idx_authorities_badge (badge_number)
);

-- =============================================
-- ADMINS TABLE (System administrators)
-- =============================================
CREATE TABLE IF NOT EXISTS admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'SUPER_ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_admins_email (email)
);

-- =============================================
-- FIRS TABLE (First Information Reports)
-- =============================================
CREATE TABLE IF NOT EXISTS firs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fir_number VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    authority_id BIGINT,
    category ENUM('THEFT', 'ASSAULT', 'FRAUD', 'CYBERCRIME', 'HARASSMENT', 'VANDALISM', 'OTHER') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME,
    incident_location TEXT NOT NULL,
    status ENUM('PENDING', 'ASSIGNED', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED', 'REJECTED') DEFAULT 'PENDING',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    evidence_urls JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (authority_id) REFERENCES authorities(id) ON DELETE SET NULL,
    INDEX idx_firs_user (user_id),
    INDEX idx_firs_authority (authority_id),
    INDEX idx_firs_status (status),
    INDEX idx_firs_category (category),
    INDEX idx_firs_created (created_at)
);

-- =============================================
-- MISSING_PERSONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS missing_persons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    authority_id BIGINT,
    missing_person_name VARCHAR(255) NOT NULL,
    age INT,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    height VARCHAR(20),
    weight VARCHAR(20),
    complexion VARCHAR(50),
    identifying_marks TEXT,
    last_seen_date DATE NOT NULL,
    last_seen_location TEXT NOT NULL,
    description TEXT,
    photo_url VARCHAR(500),
    status ENUM('MISSING', 'FOUND', 'CLOSED') DEFAULT 'MISSING',
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (authority_id) REFERENCES authorities(id) ON DELETE SET NULL,
    INDEX idx_missing_user (user_id),
    INDEX idx_missing_authority (authority_id),
    INDEX idx_missing_status (status),
    INDEX idx_missing_created (created_at)
);

-- =============================================
-- UPDATES TABLE (Case status updates)
-- =============================================
CREATE TABLE IF NOT EXISTS updates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fir_id BIGINT,
    missing_person_id BIGINT,
    authority_id BIGINT NOT NULL,
    update_type ENUM('STATUS_CHANGE', 'COMMENT', 'EVIDENCE_ADDED', 'REASSIGNMENT') NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fir_id) REFERENCES firs(id) ON DELETE CASCADE,
    FOREIGN KEY (missing_person_id) REFERENCES missing_persons(id) ON DELETE CASCADE,
    FOREIGN KEY (authority_id) REFERENCES authorities(id) ON DELETE CASCADE,
    INDEX idx_updates_fir (fir_id),
    INDEX idx_updates_missing (missing_person_id),
    INDEX idx_updates_created (created_at),
    CHECK (fir_id IS NOT NULL OR missing_person_id IS NOT NULL)
);

-- =============================================
-- SEED DATA
-- =============================================

-- Admin (password: Admin@123)
INSERT INTO admins (email, password, full_name, role) VALUES
('admin@ocrs.gov.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/0qk1P.F0KvhHFW2dTDWw.', 'System Administrator', 'SUPER_ADMIN');

-- Authorities (password: Auth@123)
INSERT INTO authorities (email, password, full_name, badge_number, designation, station_name, station_address, phone) VALUES
('officer1@police.gov.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/0qk1P.F0KvhHFW2dTDWw.', 'Inspector Sharma', 'MH-001', 'Sub Inspector', 'Pune Central Police Station', 'Pune, Maharashtra', '9876543210'),
('officer2@police.gov.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/0qk1P.F0KvhHFW2dTDWw.', 'Inspector Patil', 'MH-002', 'Inspector', 'Mumbai Cyber Cell', 'Mumbai, Maharashtra', '9876543211'),
('officer3@police.gov.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/0qk1P.F0KvhHFW2dTDWw.', 'Inspector Deshmukh', 'MH-003', 'Sub Inspector', 'Nashik Police Station', 'Nashik, Maharashtra', '9876543212');

-- Test User (password: User@123)
INSERT INTO users (email, password, full_name, phone, address, aadhaar_number) VALUES
('testuser@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/0qk1P.F0KvhHFW2dTDWw.', 'Test User', '9999999999', 'Test Address, Pune', '123456789012');
