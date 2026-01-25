-- OCRS Auth Database Schema
-- Contains: users, authorities, admins

CREATE DATABASE IF NOT EXISTS ocrs_auth;
USE ocrs_auth;

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
