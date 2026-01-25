-- OCRS Backend Database Schema
-- Contains: firs, missing_persons, updates
-- Note: user_id and authority_id reference Auth DB but are stored as BIGINT without FK constraints

CREATE DATABASE IF NOT EXISTS ocrs_backend;
USE ocrs_backend;

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
    status ENUM('PENDING', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED', 'REJECTED') DEFAULT 'PENDING',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    evidence_urls JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    INDEX idx_updates_fir (fir_id),
    INDEX idx_updates_missing (missing_person_id),
    INDEX idx_updates_created (created_at)
);
