# API Reference Documentation

## Overview

This document provides comprehensive API documentation for the OCRS (Online Crime Reporting System). All APIs are accessed through the API Gateway at the base URL.

**Base URL**: `https://ocrs.ghagevaibhav.xyz/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Auth Service APIs](#auth-service-apis)
3. [User APIs](#user-apis)
4. [Authority APIs](#authority-apis)
5. [Admin APIs](#admin-apis)
6. [Error Handling](#error-handling)

---

## Authentication

### JWT Bearer Token

All protected endpoints require a JWT Bearer token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Structure

```json
{
  "id": 1,
  "sub": "user@example.com",
  "role": "USER",
  "iat": 1706000000,
  "exp": 1706003600
}
```

### Token Expiration

| Token Type | Expiration |
|------------|------------|
| Access Token | 1 hour (3600000 ms) |
| Refresh Token | 7 days (604800000 ms) |

---

## Auth Service APIs

Base path: `/api/auth`

### Register User

Create a new user account.

```http
POST /api/auth/register/user
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phone": "+91-9876543210",
  "address": "123 Main Street, Mumbai, Maharashtra",
  "aadhaarNumber": "123456789012"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "userId": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "expiresIn": 3600
  }
}
```

**Error Responses**:
| Code | Message |
|------|---------|
| 400 | Email already registered |
| 400 | Aadhaar number already registered |

---

### Register Authority

Create a new authority (police officer) account.

```http
POST /api/auth/register/authority
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "officer@police.gov.in",
  "password": "SecurePass123!",
  "fullName": "Inspector Sharma",
  "badgeNumber": "MH-POL-12345",
  "designation": "Sub-Inspector",
  "stationName": "Andheri Police Station",
  "stationAddress": "MIDC, Andheri East, Mumbai - 400093",
  "phone": "+91-9876543210"
}
```

**Response (201)**: Same structure as user registration with `role: "AUTHORITY"`

---

### Login

Authenticate user and receive tokens.

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "USER"
}
```

**Role Values**: `USER`, `AUTHORITY`, `ADMIN`

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "userId": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "expiresIn": 3600
  }
}
```

---

### Refresh Token

Get new access token using refresh token.

```http
POST /api/auth/refresh
Content-Type: application/json
```

**Request Body**:
```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200)**: Returns new access and refresh tokens.

---

### Logout

Logout and revoke refresh tokens.

```http
POST /api/auth/logout?userId=1&role=USER
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": true
}
```

---

## User APIs

Base path: `/api/user`

**Required Role**: `USER`

### File FIR

Submit a new First Information Report.

```http
POST /api/user/fir
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "category": "THEFT",
  "title": "Mobile Phone Stolen",
  "description": "My iPhone 14 Pro was stolen from...",
  "incidentDate": "2024-01-25",
  "incidentTime": "14:30:00",
  "incidentLocation": "Andheri Station, Mumbai",
  "evidenceUrls": "[\"https://storage.example.com/evidence1.jpg\"]"
}
```

**Categories**: `THEFT`, `ASSAULT`, `FRAUD`, `CYBERCRIME`, `HARASSMENT`, `VANDALISM`, `OTHER`

**Response (200)**:
```json
{
  "success": true,
  "message": "FIR filed successfully",
  "data": {
    "id": 1,
    "firNumber": "FIR-A1B2C3D4",
    "userId": 1,
    "authorityId": 3,
    "category": "THEFT",
    "title": "Mobile Phone Stolen",
    "description": "My iPhone 14 Pro was stolen from...",
    "incidentDate": "2024-01-25",
    "incidentTime": "14:30:00",
    "incidentLocation": "Andheri Station, Mumbai",
    "status": "PENDING",
    "priority": "MEDIUM",
    "evidenceUrls": "[\"https://storage.example.com/evidence1.jpg\"]",
    "createdAt": "2024-01-25T15:00:00",
    "updatedAt": "2024-01-25T15:00:00"
  }
}
```

---

### Get My FIRs

Get all FIRs filed by the current user.

```http
GET /api/user/firs
Authorization: Bearer <token>
```

**Response (200)**:
```json
[
  {
    "id": 1,
    "firNumber": "FIR-A1B2C3D4",
    "category": "THEFT",
    "title": "Mobile Phone Stolen",
    "status": "PENDING",
    "priority": "MEDIUM",
    "createdAt": "2024-01-25T15:00:00"
  }
]
```

---

### Get FIR by ID

```http
GET /api/user/fir/{id}
Authorization: Bearer <token>
```

---

### Get FIR by Number

```http
GET /api/user/fir/number/{firNumber}
Authorization: Bearer <token>
```

---

### Get FIR Updates

Get status updates for a specific FIR.

```http
GET /api/user/fir/{firId}/updates
Authorization: Bearer <token>
```

**Response (200)**:
```json
[
  {
    "id": 1,
    "firId": 1,
    "authorityId": 3,
    "updateType": "STATUS_CHANGE",
    "previousStatus": "PENDING",
    "newStatus": "UNDER_INVESTIGATION",
    "comment": "Case under investigation. Witness statements collected.",
    "createdAt": "2024-01-26T10:00:00"
  }
]
```

---

### File Missing Person Report

```http
POST /api/user/missing
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "personName": "Jane Doe",
  "age": 25,
  "gender": "Female",
  "description": "Height 5'4\", fair complexion, wearing blue dress",
  "lastSeenLocation": "Juhu Beach, Mumbai",
  "lastSeenDate": "2024-01-24",
  "photoUrls": "[\"https://storage.example.com/photo1.jpg\"]"
}
```

---

### Get My Missing Person Reports

```http
GET /api/user/missing-reports
Authorization: Bearer <token>
```

---

## Authority APIs

Base path: `/api/authority`

**Required Role**: `AUTHORITY`

### Get Analytics

Get dashboard analytics for assigned cases.

```http
GET /api/authority/analytics
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "totalFIRs": 25,
  "pendingFIRs": 5,
  "underInvestigation": 15,
  "resolvedFIRs": 5,
  "totalMissingPersons": 10,
  "categoryBreakdown": {
    "THEFT": 10,
    "ASSAULT": 5,
    "FRAUD": 3,
    "CYBERCRIME": 4,
    "OTHER": 3
  },
  "priorityBreakdown": {
    "LOW": 5,
    "MEDIUM": 12,
    "HIGH": 6,
    "URGENT": 2
  }
}
```

---

### Get Assigned FIRs

```http
GET /api/authority/firs
Authorization: Bearer <token>
```

---

### Get Assigned FIRs (Paginated)

```http
GET /api/authority/firs/paged?page=0&size=10&sortBy=createdAt&sortDir=desc
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 0 | Page number (0-indexed) |
| size | int | 10 | Items per page |
| sortBy | string | createdAt | Sort field |
| sortDir | string | desc | Sort direction (asc/desc) |

---

### Search FIRs

```http
GET /api/authority/firs/search?search=theft&category=THEFT&status=PENDING
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Text search |
| category | enum | No | Filter by category |
| priority | enum | No | Filter by priority |
| status | enum | No | Filter by status |
| page | int | No | Page number |
| size | int | No | Page size |

---

### Update FIR Status

Update the status and add a note to an assigned FIR.

```http
PUT /api/authority/fir/{firId}/update
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "updateType": "STATUS_CHANGE",
  "newStatus": "UNDER_INVESTIGATION",
  "comment": "Investigation initiated. CCTV footage being analyzed."
}
```

**Update Types**: `STATUS_CHANGE`, `INVESTIGATION_UPDATE`, `EVIDENCE_ADDED`, `REASSIGNMENT`, `OTHER`

**Status Values**: `PENDING`, `UNDER_INVESTIGATION`, `RESOLVED`, `CLOSED`, `REJECTED`

---

### Get FIR Updates

```http
GET /api/authority/fir/{firId}/updates
Authorization: Bearer <token>
```

---

## Admin APIs

Base path: `/api/admin`

**Required Role**: `ADMIN`

### Get All FIRs

```http
GET /api/admin/firs
Authorization: Bearer <token>
```

---

### Get All Users

```http
GET /api/admin/users
Authorization: Bearer <token>
```

---

### Get All Authorities

```http
GET /api/admin/authorities
Authorization: Bearer <token>
```

---

### Reassign FIR

```http
PUT /api/admin/fir/{firId}/reassign?newAuthorityId=5
Authorization: Bearer <token>
```

---

### Deactivate Authority

```http
DELETE /api/authority/{id}
Authorization: Bearer <token>
```

---

## Error Handling

### Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "path": "/api/endpoint",
  "timestamp": "2024-01-25T15:00:00"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

### JWT Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| MISSING_TOKEN | No Authorization header | 401 |
| INVALID_TOKEN_FORMAT | Not Bearer token format | 401 |
| TOKEN_EXPIRED | Token has expired | 401 |
| MALFORMED_TOKEN | Invalid token structure | 401 |
| INVALID_TOKEN | Signature verification failed | 401 |
| INSUFFICIENT_PERMISSIONS | Wrong role for endpoint | 403 |

### Rate Limiting

When rate limited, response includes:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Remaining: 0
Retry-After: 60
```

---

## cURL Examples

### Login
```bash
curl -X POST https://ocrs.ghagevaibhav.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","role":"USER"}'
```

### File FIR
```bash
curl -X POST https://ocrs.ghagevaibhav.xyz/api/user/fir \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "category": "THEFT",
    "title": "Wallet Stolen",
    "description": "My wallet was stolen at the market",
    "incidentDate": "2024-01-25",
    "incidentLocation": "Crawford Market, Mumbai"
  }'
```

### Get Assigned FIRs
```bash
curl -X GET "https://ocrs.ghagevaibhav.xyz/api/authority/firs/paged?page=0&size=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

*API Documentation for OCRS Project*
