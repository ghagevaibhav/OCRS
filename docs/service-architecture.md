# OCRS Service Architecture & Communication Flow

## Service Overview

```mermaid
graph TD
    subgraph "Frontend Layer"
        FE[React Frontend<br/>Port 3001]
    end

    subgraph "API Gateway Layer"
        AUTH[Auth Service<br/>Spring Boot<br/>Port 8081]
        MAIN[Backend Monolith<br/>Spring Boot<br/>Port 8080]
    end

    subgraph "Microservices Layer"
        EMAIL[Email Service<br/>Node.js<br/>Port 3000]
        LOG[Logging Service<br/>.NET<br/>Port 5000]
    end

    subgraph "Database Layer"
        DB[(MySQL<br/>Port 3306)]
    end

    FE -->|"Authentication<br/>(JWT)"| AUTH
    FE -->|"Business Logic<br/>(JWT Protected)"| MAIN
    AUTH -->|"Read/Write Users"| DB
    MAIN -->|"Read/Write FIRs,<br/>Missing Persons"| DB
    MAIN -->|"Send Notifications"| EMAIL
    MAIN -->|"Log Events"| LOG
    AUTH -->|"Log Events"| LOG

    style FE fill:#61dafb
    style AUTH fill:#6db33f
    style MAIN fill:#6db33f
    style EMAIL fill:#f7df1e
    style LOG fill:#512bd4
    style DB fill:#4479a1
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant AUTH as Auth Service
    participant DB as MySQL

    U->>FE: Enter credentials
    FE->>AUTH: POST /api/auth/login
    AUTH->>DB: Verify credentials
    DB-->>AUTH: User data
    AUTH-->>FE: JWT Token + User info
    FE->>FE: Store token in localStorage
    FE-->>U: Redirect to dashboard
```

---

## FIR Filing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant MAIN as Backend Monolith
    participant DB as MySQL
    participant EMAIL as Email Service
    participant LOG as Logging Service

    U->>FE: Fill FIR form
    FE->>MAIN: POST /api/user/fir (JWT)
    MAIN->>MAIN: Validate JWT
    MAIN->>DB: Get active authorities
    MAIN->>MAIN: Random assignment
    MAIN->>DB: Save FIR
    MAIN->>EMAIL: POST /api/notify
    EMAIL-->>MAIN: Notification sent
    MAIN->>LOG: POST /api/log
    LOG-->>MAIN: Event logged
    MAIN-->>FE: FIR Number
    FE-->>U: Success message
```

---

## Authority Status Update Flow

```mermaid
sequenceDiagram
    participant A as Authority
    participant FE as Frontend
    participant MAIN as Backend Monolith
    participant DB as MySQL
    participant EMAIL as Email Service
    participant LOG as Logging Service

    A->>FE: Update case status
    FE->>MAIN: PUT /api/authority/fir/{id}/update (JWT)
    MAIN->>MAIN: Verify authority assignment
    MAIN->>DB: Update FIR status
    MAIN->>DB: Create update record
    MAIN->>EMAIL: Notify user of update
    MAIN->>LOG: Log status change
    MAIN-->>FE: Updated FIR
    FE-->>A: Confirmation
```

---

## Inter-Service Communication Protocol

| From | To | Protocol | Method | Endpoint | Purpose |
|------|-----|----------|--------|----------|---------|
| Frontend | Auth Service | HTTP | POST | `/api/auth/login` | User authentication |
| Frontend | Auth Service | HTTP | POST | `/api/auth/register/user` | User registration |
| Frontend | Backend | HTTP | POST/GET | `/api/user/*` | User operations |
| Frontend | Backend | HTTP | POST/GET | `/api/authority/*` | Authority operations |
| Frontend | Backend | HTTP | GET | `/api/admin/*` | Admin operations |
| Backend | Email Service | HTTP | POST | `/api/notify` | Send notifications |
| Backend | Logging Service | HTTP | POST | `/api/log` | Log events |
| Backend | MySQL | JDBC | - | - | Data persistence |
| Auth Service | MySQL | JDBC | - | - | User data |

---

## Service Ports Summary

| Service | Port | Technology | Responsibility |
|---------|------|------------|----------------|
| Frontend | 5173 | React + Vite | User interface |
| Auth Service | 8081 | Spring Boot | JWT authentication |
| Backend Monolith | 8080 | Spring Boot | Business logic |
| Email Service | 3000 | Node.js/Express | Email notifications |
| Logging Service | 5000 | .NET 10 | Centralized logging |
| MySQL | 3306 | MySQL 8 | Data persistence |
