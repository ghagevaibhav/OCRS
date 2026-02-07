# OCRS - Online Crime Reporting System
## Complete Technical Documentation

---

# 0. Executive Summary & Metadata

| Property | Value |
|----------|-------|
| **Business Domain** | Law enforcement crime reporting and case management platform |
| **Architecture Style** | Microservices with API Gateway pattern |
| **Primary Tech Stack** | Java 21/Spring Boot 3.x, Node.js/Express, .NET 10, React 18, MySQL 8, Redis 7 |
| **Team Bus Factor** | 2-3 (moderate risk - single developer codebase with good separation) |

### Top 5 Critical Risks

| # | Risk | Severity | Impact |
|---|------|----------|--------|
| 1 | Hardcoded secrets in docker-compose.yml | CRITICAL | Complete system compromise if leaked |
| 2 | No input sanitization on Aadhaar numbers | HIGH | PII exposure, regulatory violation |
| 3 | Missing rate limiting on internal services | HIGH | DoS vulnerability on backend-monolith |
| 4 | No database encryption at rest | MEDIUM | Data breach exposure |
| 5 | Single-point-of-failure on Eureka | MEDIUM | Service discovery outage |

---

# 1. System-wide Overview & Context Diagrams

## 1.1 Business Capability Map

```mermaid
mindmap
  root((OCRS Platform))
    Crime Reporting
      FIR Filing
      Missing Person Reports
      Evidence Upload
    Case Management
      Status Tracking
      Authority Assignment
      Case Updates
    User Management
      Citizen Registration
      Authority Registration
      Admin Management
    Notifications
      Email Alerts
      Status Updates
    Audit & Compliance
      Event Logging
      Audit Trail
```

## 1.2 System Context Diagram (C4 Level 1)

```mermaid
C4Context
    title System Context Diagram - OCRS

    Person(citizen, "Citizen", "Files FIRs and missing person reports")
    Person(authority, "Police Authority", "Manages assigned cases")
    Person(admin, "System Admin", "Manages authorities and system")

    System(ocrs, "OCRS Platform", "Online Crime Reporting System")

    System_Ext(email, "Mailtrap SMTP", "Email delivery service")
    System_Ext(browser, "Web Browser", "React SPA client")

    Rel(citizen, ocrs, "Files reports, tracks status")
    Rel(authority, ocrs, "Updates cases, views analytics")
    Rel(admin, ocrs, "Manages authorities, reassigns cases")
    Rel(ocrs, email, "Sends notifications via SMTP")
    Rel(browser, ocrs, "HTTPS requests via API Gateway")
```

## 1.3 Architectural Decision Records (ADR Summary)

| ADR | Decision | Rationale | Trade-offs |
|-----|----------|-----------|------------|
| ADR-001 | Separate Auth and Backend databases | Data isolation, independent scaling | Cross-service joins require Feign calls |
| ADR-002 | API Gateway with JWT validation | Centralized security, reduced backend load | Single point of failure |
| ADR-003 | Redis for rate limiting | Fast, distributed counters | Additional infrastructure dependency |
| ADR-004 | Eureka for service discovery | Spring ecosystem integration | No built-in HA without clustering |
| ADR-005 | Polyglot microservices | Best tool per job | Increased operational complexity |
| ADR-006 | Gateway-trusts-headers pattern | Eliminates redundant JWT parsing | Requires gateway secret validation |

---

# 2. C4 Model - Level 2 (Container Diagram)

## 2.1 Container Diagram

```mermaid
C4Container
    title Container Diagram - OCRS Platform

    Person(user, "User", "Citizen/Authority/Admin")

    Container_Boundary(frontend_boundary, "Frontend") {
        Container(spa, "React SPA", "React 18, Vite", "Single Page Application")
    }

    Container_Boundary(gateway_boundary, "Edge Layer") {
        Container(gateway, "API Gateway", "Spring Cloud Gateway", "JWT validation, rate limiting, routing")
        ContainerDb(redis, "Redis", "Redis 7", "Rate limit counters")
    }

    Container_Boundary(services_boundary, "Application Services") {
        Container(auth, "Auth Service", "Spring Boot 3.x", "Authentication, user management")
        Container(backend, "Backend Monolith", "Spring Boot 3.x", "FIR/Missing Person CRUD")
        Container(email, "Email Service", "Node.js/Express", "Email notifications")
        Container(logging, "Logging Service", ".NET 10", "Audit logging")
    }

    Container_Boundary(discovery_boundary, "Infrastructure") {
        Container(eureka, "Eureka Server", "Spring Cloud Netflix", "Service registry")
    }

    Container_Boundary(data_boundary, "Data Layer") {
        ContainerDb(authdb, "Auth DB", "MySQL 8", "Users, authorities, admins, tokens")
        ContainerDb(backenddb, "Backend DB", "MySQL 8", "FIRs, missing persons, updates")
    }

    Rel(user, spa, "Uses", "HTTPS")
    Rel(spa, gateway, "API calls", "HTTPS/JSON")
    Rel(gateway, redis, "Rate limit check", "TCP")
    Rel(gateway, auth, "Routes /api/auth/**", "HTTP")
    Rel(gateway, backend, "Routes /api/user/**, /api/authority/**, /api/admin/**", "HTTP")
    Rel(auth, authdb, "Reads/Writes", "JDBC")
    Rel(backend, backenddb, "Reads/Writes", "JDBC")
    Rel(backend, auth, "Feign client", "HTTP")
    Rel(backend, email, "HTTP POST", "REST")
    Rel(backend, logging, "HTTP POST", "REST")
    Rel(auth, logging, "HTTP POST", "REST")
    Rel(auth, eureka, "Registers", "HTTP")
    Rel(backend, eureka, "Registers", "HTTP")
    Rel(gateway, eureka, "Discovers", "HTTP")
```

## 2.2 Deployment View

```mermaid
flowchart TB
    subgraph "Docker Host"
        subgraph "Network: ocrs-network"
            subgraph "Edge"
                NGINX["Nginx :80/:443"]
                GW["API Gateway :8090"]
                REDIS["Redis :6379"]
            end

            subgraph "Services"
                AUTH["Auth Service :8081"]
                BACKEND["Backend Service :8080"]
                EMAIL["Email Service :3000"]
                LOGGING["Logging Service :5000"]
            end

            subgraph "Discovery"
                EUREKA["Eureka Server :8761"]
            end

            subgraph "Data"
                AUTHDB["MySQL Auth :3307"]
                BACKENDDB["MySQL Backend :3308"]
            end

            subgraph "Frontend"
                REACT["React SPA :3001"]
            end
        end
    end

    NGINX --> GW
    GW --> REDIS
    GW --> AUTH
    GW --> BACKEND
    BACKEND --> AUTH
    BACKEND --> EMAIL
    BACKEND --> LOGGING
    AUTH --> LOGGING
    AUTH --> AUTHDB
    BACKEND --> BACKENDDB
    AUTH --> EUREKA
    BACKEND --> EUREKA
    GW --> EUREKA
```

## 2.3 Port Mapping

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| Eureka Server | 8761 | 8761 | HTTP |
| API Gateway | 8090 | 8090 | HTTP |
| Auth Service | 8081 | - (internal) | HTTP |
| Backend Service | 8080 | - (internal) | HTTP |
| Email Service | 3000 | 3000 | HTTP |
| Logging Service | 5000 | 5000 | HTTP |
| Redis | 6379 | 6379 | TCP |
| Auth MySQL | 3306 | 3307 | TCP |
| Backend MySQL | 3306 | 3308 | TCP |
| Frontend | 80 | 3001 | HTTP |

---

# 3. C4 Model - Level 3 (Component Diagrams)

## 3.1 Auth Service Components

```mermaid
flowchart TB
    subgraph "Auth Service"
        subgraph "Controllers"
            AC[AuthController]
            AUC[AuthorityController]
            IAC[InternalAuthController]
            HC[HealthController]
        end

        subgraph "Services"
            AS[AuthService]
            RTS[RefreshTokenService]
            LC[LoggingClient]
        end

        subgraph "Security"
            JU[JwtUtils]
            SC[SecurityConfig]
        end

        subgraph "Repositories"
            UR[UserRepository]
            AR[AuthorityRepository]
            ADR[AdminRepository]
            RTR[RefreshTokenRepository]
        end

        subgraph "Entities"
            UE[User]
            AE[Authority]
            ADE[Admin]
            RTE[RefreshToken]
        end
    end

    AC --> AS
    AUC --> AS
    IAC --> AS
    AS --> JU
    AS --> RTS
    AS --> LC
    AS --> UR
    AS --> AR
    AS --> ADR
    RTS --> RTR
    UR --> UE
    AR --> AE
    ADR --> ADE
    RTR --> RTE
```

## 3.2 Backend Monolith Components

```mermaid
flowchart TB
    subgraph "Backend Monolith"
        subgraph "Controllers"
            UC[UserController]
            AUC2[AuthorityController]
            ADC[AdminController]
        end

        subgraph "Services"
            FS[FIRService]
            MPS[MissingPersonService]
            ANS[AnalyticsService]
            ESC[ExternalServiceClient]
        end

        subgraph "Security"
            GAF[GatewayAuthFilter]
            SEC[SecurityConfig]
        end

        subgraph "Clients"
            ASC[AuthServiceClient]
        end

        subgraph "Repositories"
            FR[FIRRepository]
            MPR[MissingPersonRepository]
            UPR[UpdateRepository]
        end
    end

    UC --> FS
    UC --> MPS
    AUC2 --> FS
    AUC2 --> MPS
    AUC2 --> ANS
    ADC --> FS
    ADC --> MPS
    FS --> ASC
    FS --> ESC
    MPS --> ASC
    MPS --> ESC
    FS --> FR
    FS --> UPR
    MPS --> MPR
    MPS --> UPR
```

---

# 4. Module/Package Structure & Dependencies

## 4.1 Project Tree

```
ocrs-project/
├── api-gateway/                    # Spring Cloud Gateway
│   └── src/main/java/com/ocrs/gateway/
│       ├── ApiGatewayApplication.java
│       ├── config/
│       │   ├── CorsConfig.java
│       │   └── RateLimitConfig.java
│       ├── filter/
│       │   └── JwtAuthFilter.java
│       └── exception/
│           └── GlobalExceptionHandler.java
│
├── auth-service/                   # Authentication microservice
│   └── src/main/java/com/ocrs/auth/
│       ├── AuthServiceApplication.java
│       ├── config/
│       │   ├── DataSeeder.java
│       │   └── SecurityConfig.java
│       ├── controller/
│       │   ├── AuthController.java
│       │   ├── AuthorityController.java
│       │   ├── HealthController.java
│       │   └── InternalAuthController.java
│       ├── dto/
│       │   ├── ApiResponse.java
│       │   ├── AuthResponse.java
│       │   ├── LoginRequest.java
│       │   └── ...
│       ├── entity/
│       │   ├── User.java
│       │   ├── Authority.java
│       │   ├── Admin.java
│       │   └── RefreshToken.java
│       ├── exception/
│       │   ├── GlobalExceptionHandler.java
│       │   └── TokenRefreshException.java
│       ├── repository/
│       │   └── ...
│       ├── security/
│       │   └── JwtUtils.java
│       └── service/
│           ├── AuthService.java
│           ├── RefreshTokenService.java
│           └── LoggingClient.java
│
├── backend-monolith/               # Core business logic
│   └── src/main/java/com/ocrs/backend/
│       ├── BackendMonolithApplication.java
│       ├── client/
│       │   ├── AuthServiceClient.java
│       │   └── AuthServiceFallbackFactory.java
│       ├── config/
│       │   └── SecurityConfig.java
│       ├── controller/
│       │   ├── UserController.java
│       │   ├── AuthorityController.java
│       │   └── AdminController.java
│       ├── dto/
│       │   └── ...
│       ├── entity/
│       │   ├── FIR.java
│       │   ├── MissingPerson.java
│       │   └── Update.java
│       ├── repository/
│       │   └── ...
│       ├── security/
│       │   ├── GatewayAuthFilter.java
│       │   ├── CustomAccessDeniedHandler.java
│       │   └── JwtAuthenticationEntryPoint.java
│       └── service/
│           ├── FIRService.java
│           ├── MissingPersonService.java
│           ├── AnalyticsService.java
│           └── ExternalServiceClient.java
│
├── email-service/                  # Node.js email sender
│   └── src/
│       ├── index.js
│       ├── routes/emailRoutes.js
│       └── services/emailService.js
│
├── logging-service/                # .NET audit logging
│   ├── Program.cs
│   ├── Controllers/LogController.cs
│   └── Models/LogModels.cs
│
├── eureka-server/                  # Service discovery
│   └── src/main/java/.../EurekaServerApplication.java
│
├── frontend/                       # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── context/
│
├── docker-compose.yml
└── docs/
```

## 4.2 Dependency Graph

```mermaid
flowchart TD
    subgraph "External Clients"
        BROWSER[Browser/React SPA]
    end

    subgraph "Edge"
        GW[API Gateway]
    end

    subgraph "Core Services"
        AUTH[Auth Service]
        BACKEND[Backend Monolith]
    end

    subgraph "Supporting Services"
        EMAIL[Email Service]
        LOGGING[Logging Service]
    end

    subgraph "Infrastructure"
        EUREKA[Eureka Server]
        REDIS[Redis]
    end

    subgraph "Data"
        AUTHDB[(Auth DB)]
        BACKENDDB[(Backend DB)]
    end

    BROWSER -->|HTTPS| GW
    GW -->|Rate Limit| REDIS
    GW -->|Discovery| EUREKA
    GW -->|Route| AUTH
    GW -->|Route| BACKEND

    AUTH -->|Discovery| EUREKA
    AUTH -->|JDBC| AUTHDB
    AUTH -->|HTTP| LOGGING

    BACKEND -->|Discovery| EUREKA
    BACKEND -->|JDBC| BACKENDDB
    BACKEND -->|Feign| AUTH
    BACKEND -->|HTTP| EMAIL
    BACKEND -->|HTTP| LOGGING
```

## 4.3 Circular Dependency Analysis

**No circular dependencies detected** between services. The dependency flow is strictly unidirectional:

- `backend-monolith` → `auth-service` (via Feign client)
- `backend-monolith` → `email-service` (via HTTP)
- `backend-monolith` → `logging-service` (via HTTP)
- `auth-service` → `logging-service` (via HTTP)

---

# 5. Security Architecture & Controls

## 5.1 Authentication Flow Sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant DB as Auth DB

    rect rgb(200, 230, 200)
        Note over C,DB: Login Flow
        C->>GW: POST /api/auth/login {email, password, role}
        GW->>AUTH: Forward request (no JWT required)
        AUTH->>DB: Find user by email + role
        DB-->>AUTH: User record
        AUTH->>AUTH: Verify password (BCrypt)
        AUTH->>AUTH: Generate JWT (HS256, 1hr)
        AUTH->>DB: Create RefreshToken (7 days)
        AUTH-->>GW: {accessToken, refreshToken, user}
        GW-->>C: 200 OK + tokens
    end

    rect rgb(200, 200, 230)
        Note over C,DB: Authenticated Request
        C->>GW: GET /api/user/firs (Authorization: Bearer <JWT>)
        GW->>GW: Validate JWT signature
        GW->>GW: Check token expiry
        GW->>GW: Extract claims (id, email, role)
        GW->>GW: Verify role = USER
        GW->>BACKEND: Forward + X-User-Id, X-User-Email, X-User-Role
        BACKEND->>BACKEND: GatewayAuthFilter validates gateway secret
        BACKEND->>BACKEND: Set SecurityContext from headers
        BACKEND-->>GW: FIR list
        GW-->>C: 200 OK + data
    end

    rect rgb(230, 200, 200)
        Note over C,DB: Token Refresh Flow
        C->>GW: POST /api/auth/refresh {refreshToken}
        GW->>AUTH: Forward request
        AUTH->>DB: Find token, verify not revoked/expired
        AUTH->>AUTH: Generate new access token
        AUTH->>DB: Revoke old refresh token
        AUTH->>DB: Create new refresh token (rotation)
        AUTH-->>GW: {newAccessToken, newRefreshToken}
        GW-->>C: 200 OK + new tokens
    end
```

## 5.2 JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user@example.com",
    "id": 123,
    "role": "USER",
    "iat": 1706745600,
    "exp": 1706749200
  }
}
```

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | String | User email address (subject) |
| `id` | Long | User ID from database |
| `role` | String | USER, AUTHORITY, or ADMIN |
| `iat` | Long | Issued at timestamp |
| `exp` | Long | Expiration timestamp (1 hour from iat) |

## 5.3 Authorization Model (RBAC)

```mermaid
flowchart TD
    subgraph "Roles"
        USER[USER]
        AUTHORITY[AUTHORITY]
        ADMIN[ADMIN]
    end

    subgraph "Permissions"
        P1[File FIR]
        P2[File Missing Person Report]
        P3[View Own Cases]
        P4[Update Assigned Cases]
        P5[View Analytics]
        P6[Manage Authorities]
        P7[Reassign Cases]
        P8[View All Cases]
    end

    USER --> P1
    USER --> P2
    USER --> P3

    AUTHORITY --> P4
    AUTHORITY --> P5

    ADMIN --> P6
    ADMIN --> P7
    ADMIN --> P8
```

### Role-Based Route Protection

| Route Pattern | Required Role | Gateway Filter | Controller Annotation |
|--------------|---------------|----------------|----------------------|
| `/api/auth/**` | None | - | - |
| `/api/user/**` | USER | `JwtAuthFilter(requiredRole: USER)` | `@PreAuthorize("hasRole('USER')")` |
| `/api/authority/**` | AUTHORITY | `JwtAuthFilter(requiredRole: AUTHORITY)` | `@PreAuthorize("hasRole('AUTHORITY')")` |
| `/api/admin/**` | ADMIN | `JwtAuthFilter(requiredRole: ADMIN)` | `@PreAuthorize("hasRole('ADMIN')")` |

## 5.4 Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer leakage |
| `X-Gateway-Secret` | (configured) | Backend validates gateway origin |
| `X-Request-Id` | UUID | Request tracing |

## 5.5 CORS Configuration

```yaml
allowedOriginPatterns:
  - http://localhost:*
allowedMethods:
  - GET, POST, PUT, DELETE, OPTIONS, PATCH
allowedHeaders: "*"
allowCredentials: true
maxAge: 3600
```

## 5.6 Secret Management Analysis

### Current Implementation (CRITICAL RISK)

| Secret | Location | Status |
|--------|----------|--------|
| JWT Secret | docker-compose.yml, application.yml | ⚠️ HARDCODED |
| DB Passwords | docker-compose.yml | ⚠️ HARDCODED |
| Gateway Secret | docker-compose.yml | ⚠️ HARDCODED |
| SMTP Credentials | Environment variables | ✅ Externalized |

### Recommended Production Solution

```yaml
# Use Docker secrets or Vault
secrets:
  jwt_secret:
    external: true
  db_password:
    external: true

services:
  auth-service:
    secrets:
      - jwt_secret
      - db_password
```

## 5.7 Input Validation

| Layer | Validation Type | Implementation |
|-------|-----------------|----------------|
| DTO | Bean Validation | `@Valid`, `@NotNull`, `@Email`, `@Size` |
| Controller | Request validation | Spring `@Valid` annotation |
| Entity | Database constraints | `@Column(nullable=false, unique=true)` |
| Service | Business rules | Programmatic checks |

### Missing Validations (Production Risk)

1. **Aadhaar Number**: No format validation (should be 12 digits with Verhoeff checksum)
2. **Phone Number**: No format validation
3. **FIR Description**: No XSS sanitization
4. **Evidence URLs**: No URL validation or domain whitelist

## 5.8 OWASP Top-10 Compliance

| Vulnerability | Status | Notes |
|---------------|--------|-------|
| A01: Broken Access Control | ✅ Partial | RBAC implemented, missing ownership validation on some endpoints |
| A02: Cryptographic Failures | ⚠️ Risk | Passwords hashed with BCrypt, but no encryption at rest |
| A03: Injection | ✅ Good | Spring Data JPA prevents SQL injection |
| A04: Insecure Design | ✅ Good | Defense-in-depth with gateway + controller auth |
| A05: Security Misconfiguration | ⚠️ Risk | Hardcoded secrets in config files |
| A06: Vulnerable Components | ⚠️ Unknown | No automated dependency scanning visible |
| A07: Auth Failures | ✅ Good | Refresh token rotation, proper logout |
| A08: Data Integrity Failures | ⚠️ Risk | No cryptographic verification of JWT key rotation |
| A09: Logging Failures | ✅ Good | Comprehensive audit logging implemented |
| A10: SSRF | ✅ Good | No user-controlled URL fetching |

---

# 6. Complete Data Model Documentation

## 6.1 Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar(255) full_name
        varchar(255) email UK
        varchar(255) password
        varchar(20) phone
        text address
        varchar(12) aadhaar_number UK
        datetime created_at
        datetime updated_at
        boolean is_active
    }

    AUTHORITIES {
        bigint id PK
        varchar(255) full_name
        varchar(255) email UK
        varchar(255) password
        varchar(50) badge_number UK
        varchar(100) designation
        varchar(255) station_name
        text station_address
        varchar(20) phone
        datetime created_at
        datetime updated_at
        boolean is_active
    }

    ADMINS {
        bigint id PK
        varchar(255) full_name
        varchar(255) email UK
        varchar(255) password
        varchar(50) role
        datetime created_at
        datetime updated_at
        boolean is_active
    }

    REFRESH_TOKENS {
        bigint id PK
        varchar(500) token UK
        bigint user_id
        varchar(20) user_role
        datetime expiry_date
        boolean revoked
        datetime created_at
    }

    FIRS {
        bigint id PK
        varchar(50) fir_number UK
        bigint user_id FK
        bigint authority_id FK
        enum category
        varchar(255) title
        text description
        date incident_date
        time incident_time
        text incident_location
        enum status
        enum priority
        json evidence_urls
        datetime created_at
        datetime updated_at
    }

    MISSING_PERSONS {
        bigint id PK
        varchar(50) case_number UK
        bigint user_id FK
        bigint authority_id FK
        varchar(255) missing_person_name
        int age
        enum gender
        varchar(50) height
        varchar(50) weight
        varchar(100) complexion
        text identifying_marks
        date last_seen_date
        text last_seen_location
        text description
        varchar(500) photo_url
        enum status
        varchar(20) contact_phone
        datetime created_at
        datetime updated_at
    }

    UPDATES {
        bigint id PK
        bigint fir_id FK
        bigint missing_person_id FK
        bigint authority_id FK
        enum update_type
        varchar(50) previous_status
        varchar(50) new_status
        text comment
        datetime created_at
    }

    USERS ||--o{ FIRS : files
    USERS ||--o{ MISSING_PERSONS : reports
    AUTHORITIES ||--o{ FIRS : assigned
    AUTHORITIES ||--o{ MISSING_PERSONS : assigned
    AUTHORITIES ||--o{ UPDATES : creates
    FIRS ||--o{ UPDATES : has
    MISSING_PERSONS ||--o{ UPDATES : has
```

## 6.2 Table-by-Table Documentation

### 6.2.1 `users` Table (Auth DB)

| Column | Type | Constraints | Business Meaning | Access Pattern |
|--------|------|-------------|------------------|----------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Unique citizen identifier | Lookup by ID |
| `full_name` | VARCHAR(255) | NOT NULL | Legal name of citizen | Display |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Login credential, communication | Login lookup |
| `password` | VARCHAR(255) | NOT NULL | BCrypt hashed password | Authentication |
| `phone` | VARCHAR(20) | NULL | Contact number | Contact |
| `address` | TEXT | NULL | Residential address | FIR context |
| `aadhaar_number` | VARCHAR(12) | UNIQUE | Indian national ID | Identity verification |
| `created_at` | DATETIME | NOT NULL | Registration timestamp | Audit |
| `updated_at` | DATETIME | NOT NULL | Last modification | Audit |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft delete flag | Access control |

**Indexes**: `email` (unique), `aadhaar_number` (unique)
**Expected Cardinality**: 10K-100K records
**Soft Delete Strategy**: `is_active = false` for deactivation

### 6.2.2 `authorities` Table (Auth DB)

| Column | Type | Constraints | Business Meaning |
|--------|------|-------------|------------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Police officer identifier |
| `full_name` | VARCHAR(255) | NOT NULL | Officer's legal name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Official email for login |
| `password` | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| `badge_number` | VARCHAR(50) | UNIQUE | Official police badge ID |
| `designation` | VARCHAR(100) | NULL | Rank (Inspector, SI, etc.) |
| `station_name` | VARCHAR(255) | NULL | Police station name |
| `station_address` | TEXT | NULL | Station location |
| `phone` | VARCHAR(20) | NULL | Contact number |
| `is_active` | BOOLEAN | DEFAULT TRUE | Officer status |

**Indexes**: `email` (unique), `badge_number` (unique)
**Expected Cardinality**: 100-1000 records

### 6.2.3 `refresh_tokens` Table (Auth DB)

| Column | Type | Constraints | Business Meaning |
|--------|------|-------------|------------------|
| `id` | BIGINT | PK | Token record ID |
| `token` | VARCHAR(500) | NOT NULL, UNIQUE | UUID-based refresh token |
| `user_id` | BIGINT | NOT NULL | Associated user/authority/admin ID |
| `user_role` | VARCHAR(20) | NOT NULL | USER, AUTHORITY, or ADMIN |
| `expiry_date` | DATETIME | NOT NULL | Token expiration (7 days default) |
| `revoked` | BOOLEAN | DEFAULT FALSE | Manual revocation flag |
| `created_at` | DATETIME | NOT NULL | Token creation time |

**Indexes**: `token` (unique), composite `(user_id, user_role)`
**Cleanup**: Scheduled job at midnight deletes expired tokens

### 6.2.4 `firs` Table (Backend DB)

| Column | Type | Constraints | Business Meaning |
|--------|------|-------------|------------------|
| `id` | BIGINT | PK | Internal FIR ID |
| `fir_number` | VARCHAR(50) | NOT NULL, UNIQUE | Public FIR reference (FIR-XXXXXXXX) |
| `user_id` | BIGINT | NOT NULL | Citizen who filed |
| `authority_id` | BIGINT | NULL | Assigned officer (auto-assigned) |
| `category` | ENUM | NOT NULL | Crime type classification |
| `title` | VARCHAR(255) | NOT NULL | Short description |
| `description` | TEXT | NOT NULL | Full incident details |
| `incident_date` | DATE | NOT NULL | When crime occurred |
| `incident_time` | TIME | NULL | Time of incident |
| `incident_location` | TEXT | NOT NULL | Where crime occurred |
| `status` | ENUM | DEFAULT 'PENDING' | Case lifecycle state |
| `priority` | ENUM | AUTO-ASSIGNED | Urgency level based on category |
| `evidence_urls` | JSON | NULL | Array of evidence file URLs |

**Category Enum Values**: THEFT, ASSAULT, FRAUD, CYBERCRIME, HARASSMENT, VANDALISM, OTHER

**Status Enum Values**: PENDING, UNDER_INVESTIGATION, RESOLVED, CLOSED, REJECTED

**Priority Enum Values**: LOW, MEDIUM, HIGH, URGENT

**Auto-Priority Assignment Logic**:
- ASSAULT → URGENT
- HARASSMENT, CYBERCRIME → HIGH
- FRAUD, THEFT, OTHER → MEDIUM
- VANDALISM → LOW

### 6.2.5 `updates` Table (Backend DB)

| Column | Type | Constraints | Business Meaning |
|--------|------|-------------|------------------|
| `id` | BIGINT | PK | Update record ID |
| `fir_id` | BIGINT | FK, NULL | Associated FIR |
| `missing_person_id` | BIGINT | FK, NULL | Associated missing person case |
| `authority_id` | BIGINT | NOT NULL | Officer who made update |
| `update_type` | ENUM | NOT NULL | Type of update |
| `previous_status` | VARCHAR(50) | NULL | Status before change |
| `new_status` | VARCHAR(50) | NULL | Status after change |
| `comment` | TEXT | NULL | Officer's notes |
| `created_at` | DATETIME | NOT NULL | Update timestamp |

**Update Type Enum**: STATUS_CHANGE, COMMENT, EVIDENCE_ADDED, REASSIGNMENT

---

# 7. API Contract & Request Lifecycle

## 7.1 API Endpoints Summary

### Auth Service Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register/user` | None | Register new citizen |
| POST | `/api/auth/register/authority` | None | Register new authority |
| POST | `/api/auth/login` | None | Authenticate user |
| POST | `/api/auth/refresh` | None | Refresh access token |
| POST | `/api/auth/revoke` | None | Revoke refresh token |
| POST | `/api/auth/logout` | None | Logout and revoke tokens |

### User Endpoints (Backend)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/user/fir` | USER | File new FIR |
| GET | `/api/user/firs` | USER | Get user's FIRs |
| GET | `/api/user/fir/{id}` | USER | Get FIR by ID |
| GET | `/api/user/fir/{firId}/updates` | USER | Get FIR updates |
| POST | `/api/user/missing` | USER | File missing person report |
| GET | `/api/user/missing-reports` | USER | Get user's reports |

### Authority Endpoints (Backend)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/authority/analytics` | AUTHORITY | Get analytics |
| GET | `/api/authority/firs` | AUTHORITY | Get assigned FIRs |
| GET | `/api/authority/firs/paged` | AUTHORITY | Paginated FIRs |
| GET | `/api/authority/firs/search` | AUTHORITY | Search/filter FIRs |
| PUT | `/api/authority/fir/{firId}/update` | AUTHORITY | Update FIR status |

### Admin Endpoints (Backend)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/firs` | ADMIN | Get all FIRs |
| PUT | `/api/admin/fir/{firId}/reassign` | ADMIN | Reassign FIR |
| GET | `/api/admin/analytics` | ADMIN | System-wide analytics |

## 7.2 Request Lifecycle - File FIR

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant REDIS as Redis
    participant BACKEND as Backend Service
    participant AUTH as Auth Service
    participant EMAIL as Email Service
    participant LOG as Logging Service
    participant DB as Backend DB

    C->>GW: POST /api/user/fir
    Note over GW: Headers: Authorization: Bearer <JWT>

    GW->>REDIS: Check rate limit (user-based)
    REDIS-->>GW: OK (token available)

    GW->>GW: JwtAuthFilter.apply()
    Note over GW: 1. Extract Bearer token
    Note over GW: 2. Validate signature (HS256)
    Note over GW: 3. Check expiration
    Note over GW: 4. Verify role = USER

    GW->>BACKEND: Forward with headers
    Note over GW: X-User-Id, X-User-Email, X-User-Role
    Note over GW: X-Gateway-Secret, X-Request-Id

    BACKEND->>BACKEND: GatewayAuthFilter
    Note over BACKEND: Validate X-Gateway-Secret
    Note over BACKEND: Set SecurityContext

    BACKEND->>BACKEND: UserController.fileFIR()
    Note over BACKEND: @PreAuthorize("hasRole('USER')")

    BACKEND->>BACKEND: FIRService.fileFIR()
    Note over BACKEND: 1. Generate FIR number
    Note over BACKEND: 2. Determine priority from category

    BACKEND->>AUTH: Feign: getActiveAuthorities()
    AUTH-->>BACKEND: List<AuthorityDTO>

    BACKEND->>BACKEND: findLeastLoadedAuthority()
    Note over BACKEND: Count active cases per authority
    Note over BACKEND: Select minimum load

    BACKEND->>DB: Save FIR
    DB-->>BACKEND: FIR with ID

    BACKEND->>AUTH: Feign: getUserById(userId)
    AUTH-->>BACKEND: UserDTO (email)

    BACKEND->>EMAIL: POST /api/send-fir-filed
    EMAIL-->>BACKEND: 200 OK

    BACKEND->>LOG: POST /api/log (FIR_FILED)
    LOG-->>BACKEND: 200 OK

    BACKEND-->>GW: ApiResponse<FIR>
    GW-->>C: 200 OK + FIR details
```

## 7.3 Rate Limiting Configuration

| Route | Rate | Burst | Key Resolver |
|-------|------|-------|--------------|
| `/api/auth/**` | 10/sec | 20 | IP Address |
| `/api/user/**` | 20/sec | 40 | User ID |
| `/api/authority/**` | 30/sec | 60 | User ID |
| `/api/admin/**` | 50/sec | 100 | User ID |

---

# 8. File-by-File Deep Documentation

## 8.1 Auth Service

### `AuthService.java` (382 lines)

**Responsibility**: Core authentication logic - registration, login, token management for all 3 user types.

**Layer Position**: Service layer (business logic)

**Design Patterns**:
- Strategy pattern (implicit): Login method dispatches to role-specific handlers
- Builder pattern: Entity construction

**Key Methods**:

| Method | Responsibility | Transaction |
|--------|----------------|-------------|
| `registerUser()` | Citizen registration, token generation | `@Transactional` |
| `registerAuthority()` | Officer registration | `@Transactional` |
| `login()` | Dispatch to role-specific login | - |
| `loginUser/Authority/Admin()` | Role-specific authentication | `@Transactional` |
| `refreshToken()` | Token rotation | `@Transactional` |
| `logout()` | Revoke all user tokens | `@Transactional` |

**Thread Safety**: Stateless service, thread-safe via Spring singleton scope.

**Dependencies Injected**:
- `UserRepository`, `AuthorityRepository`, `AdminRepository`
- `PasswordEncoder` (BCrypt)
- `JwtUtils`, `RefreshTokenService`, `LoggingClient`

### `JwtUtils.java` (114 lines)

**Responsibility**: JWT token generation and validation using HMAC-SHA256.

**Key Methods**:

| Method | Purpose |
|--------|---------|
| `generateToken()` | Create signed JWT with id, email, role claims |
| `extractAllClaims()` | Parse token once, return all claims as record |
| `validateToken()` | Verify signature, check expiration |

**Concurrency**: Stateless, key derivation is thread-safe.

**Security Note**: Uses `Keys.hmacShaKeyFor()` which requires minimum 256-bit key.

### `RefreshTokenService.java` (118 lines)

**Responsibility**: Refresh token lifecycle management with rotation.

**Key Features**:
- Token rotation on refresh (revokes old, issues new)
- Scheduled cleanup at midnight (`@Scheduled(cron = "0 0 0 * * ?")`)
- Dual UUID generation for token value

**Critical Consideration**: If this service fails, users cannot refresh tokens and must re-login.

## 8.2 API Gateway

### `JwtAuthFilter.java` (204 lines)

**Responsibility**: Gateway filter for JWT validation and role-based access control.

**Pattern**: GatewayFilterFactory (Spring Cloud Gateway pattern)

**Flow**:
1. Skip OPTIONS requests (CORS preflight)
2. Extract Authorization header
3. Parse and validate JWT
4. Check required role (from filter config)
5. Add X-User-* headers for downstream
6. Return structured JSON errors for failures

**Error Codes Returned**:
- `MISSING_TOKEN` (401)
- `INVALID_TOKEN_FORMAT` (401)
- `TOKEN_EXPIRED` (401)
- `MALFORMED_TOKEN` (401)
- `INSUFFICIENT_PERMISSIONS` (403)

### `RateLimitConfig.java` (45 lines)

**Responsibility**: Define key resolvers for rate limiting.

**Key Resolvers**:
- `ipKeyResolver`: Uses client IP (for public endpoints)
- `userKeyResolver`: Uses X-User-Id header (for authenticated endpoints)

## 8.3 Backend Monolith

### `FIRService.java` (360 lines)

**Responsibility**: FIR business logic - filing, updating, reassignment.

**Key Features**:

| Feature | Implementation |
|---------|----------------|
| Auto-priority | Rule-based assignment from category |
| Load balancing | Least-loaded authority assignment |
| Closed case protection | Cannot update CLOSED status |
| Email notifications | On file, update, reassign |
| Audit logging | All actions logged |

**Critical Method - `findLeastLoadedAuthority()`**:
```java
// Fetches all active authorities from Auth Service
// Counts active (non-closed) FIRs per authority
// Returns authority ID with minimum count
```

**Idempotency**: FIR filing is NOT idempotent (generates new FIR number each time). Consider adding request deduplication.

### `GatewayAuthFilter.java` (115 lines)

**Responsibility**: Trust gateway headers and set Spring Security context.

**Security Model**:
1. Validates `X-Gateway-Secret` header
2. Extracts `X-User-Id`, `X-User-Email`, `X-User-Role`
3. Creates `UsernamePasswordAuthenticationToken`
4. Sets `SecurityContextHolder` for `@PreAuthorize`

**Defense in Depth**: Rejects requests without valid gateway secret, preventing direct backend access.

### `UserController.java` (149 lines)

**Responsibility**: REST endpoints for citizen operations.

**Security Layers**:
- Class-level: `@PreAuthorize("hasRole('USER')")`
- Method-level: Redundant `@PreAuthorize` for defense-in-depth

**Missing**: Ownership validation on `getFIR()` - any USER can view any FIR by ID.

### `AuthorityController.java` (233 lines)

**Responsibility**: REST endpoints for police officer operations.

**Features**:
- Pagination support (`PageRequest`)
- Multi-field sorting
- Search with filters (category, priority, status)
- Analytics endpoint

## 8.4 Email Service (Node.js)

### `index.js` (40 lines)

**Responsibility**: Express app initialization, CORS config, health endpoint.

**Stack**: Express.js on Node.js 18

**CORS Origins**: Configurable via `CORS_ORIGINS` environment variable.

## 8.5 Logging Service (.NET)

### `LogController.cs` (369 lines)

**Responsibility**: Centralized audit logging with categorized file output.

**Log Categories**:
| Category | File Path | Events |
|----------|-----------|--------|
| user | `/logs/user/user_auth_logs.txt` | LOGIN, LOGOUT, USER_REGISTERED |
| authority | `/logs/authority/authority_logs.txt` | AUTHORITY_REGISTERED, case updates |
| admin | `/logs/admin/admin_logs.txt` | ADMIN_LOGIN, authority management |
| fir | `/logs/fir/fir_logs.txt` | FIR_FILED, FIR_UPDATED, MISSING_PERSON_* |

**Thread Safety**: Uses per-category lock objects for file writes.

**Dual Logging**: FIR updates are logged to both `fir` and `authority` categories.

---

# 9. Critical Business Flows

## 9.1 FIR Filing Flow (Happy Path + Errors)

```mermaid
sequenceDiagram
    participant U as User
    participant GW as Gateway
    participant B as Backend
    participant A as Auth Service
    participant E as Email
    participant L as Logger

    rect rgb(200, 230, 200)
        Note over U,L: Happy Path
        U->>GW: POST /api/user/fir
        GW->>GW: Validate JWT, role=USER
        GW->>B: Forward with user headers
        B->>A: getActiveAuthorities()
        A-->>B: [Authority1, Authority2, ...]
        B->>B: Select least loaded
        B->>B: Determine priority from category
        B->>B: Generate FIR-XXXXXXXX
        B->>DB: INSERT FIR
        B->>A: getUserById()
        A-->>B: UserDTO
        B->>E: sendFirFiledNotification()
        B->>L: log(FIR_FILED)
        B-->>GW: 200 + FIR
        GW-->>U: Success
    end

    rect rgb(230, 200, 200)
        Note over U,L: Error: No Authorities Available
        U->>GW: POST /api/user/fir
        GW->>B: Forward
        B->>A: getActiveAuthorities()
        A-->>B: [] (empty)
        B->>B: authority_id = NULL
        Note over B: FIR filed but unassigned
        B->>E: Notification (no assigned officer)
        B-->>GW: 200 + FIR (unassigned)
    end

    rect rgb(230, 220, 200)
        Note over U,L: Error: JWT Expired
        U->>GW: POST /api/user/fir
        GW->>GW: JWT validation fails
        GW-->>U: 401 TOKEN_EXPIRED
    end
```

## 9.2 Case Status Update Flow

```mermaid
sequenceDiagram
    participant AU as Authority
    participant GW as Gateway
    participant B as Backend
    participant A as Auth Service
    participant E as Email
    participant L as Logger

    AU->>GW: PUT /api/authority/fir/{id}/update
    GW->>GW: Validate JWT, role=AUTHORITY
    GW->>B: Forward

    B->>DB: Find FIR by ID
    alt FIR not found
        B-->>GW: 400 "FIR not found"
    else Authority not assigned
        B-->>GW: 400 "Not authorized"
    else FIR is CLOSED
        B-->>GW: 400 "Cannot update closed case"
    else Valid
        B->>DB: UPDATE FIR status
        B->>DB: INSERT Update record
        B->>A: getUserById(fir.userId)
        A-->>B: UserDTO
        B->>E: sendFirUpdateNotification()
        B->>L: log(FIR_UPDATED)
        B-->>GW: 200 + updated FIR
    end
```

## 9.3 Token Refresh Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as Gateway
    participant A as Auth Service
    participant DB as Database

    C->>GW: POST /api/auth/refresh {refreshToken}
    GW->>A: Forward (no JWT validation)

    A->>DB: Find refresh token
    alt Token not found
        A-->>GW: 401 "Refresh token not found"
    else Token revoked
        A-->>GW: 401 "Token revoked"
    else Token expired
        A->>DB: Mark token as revoked
        A-->>GW: 401 "Token expired"
    else Valid
        A->>A: Generate new access token
        A->>DB: Revoke old refresh token
        A->>DB: Create new refresh token
        A-->>GW: 200 + new tokens
    end
    GW-->>C: Response
```

---

# 10. Operations & Production Readiness

## 10.1 Logging Strategy

### Structured Logging Format

**Java Services (Logback)**:
```
2025-01-15 14:23:45.123 INFO [auth-service,trace-id,span-id] c.o.a.s.AuthService - user registered: user@example.com
```

**Node.js (Console)**:
```
[2025-01-15T14:23:45.123Z] INFO: Email sent to user@example.com
```

**.NET (Serilog)**:
```
2025-01-15 14:23:45 [INF] ABC12345 - 2025-01-15 14:23:45 - User Login - User ID: 123, Email: user@example.com
```

### Log Levels

| Level | Usage |
|-------|-------|
| ERROR | Exceptions, failed operations |
| WARN | Suspicious activity, degraded operations |
| INFO | Business events (login, FIR filed) |
| DEBUG | Request/response details, internal flow |

### Correlation ID

**Current Status**: `X-Request-Id` header added by gateway but NOT propagated through Feign calls.

**Recommended Fix**: Add MDC-based correlation ID propagation.

## 10.2 Health Checks

| Service | Endpoint | Checks |
|---------|----------|--------|
| Eureka | `/actuator/health` | Self |
| Gateway | `/actuator/health` | Self, Redis, Eureka |
| Auth Service | `/actuator/health` | Self, MySQL, Eureka |
| Backend | `/actuator/health` | Self, MySQL, Eureka |
| Email | `/health` | Self |
| Logging | `/health` | Self, log directory |

## 10.3 Metrics Exposed

**Spring Boot Actuator** (via Prometheus endpoint):

- `jvm_*`: Memory, GC, threads
- `http_server_requests_*`: Request count, latency
- `spring_data_repository_*`: Database operations
- `resilience4j_*`: Circuit breaker state

## 10.4 Alerting Recommendations

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | 5xx > 1% of requests | P1 |
| Auth Service Down | Health check fails 3x | P1 |
| Database Connection Exhausted | Pool utilization > 90% | P2 |
| JWT Token Errors Spike | TOKEN_EXPIRED > 100/min | P3 |
| Rate Limit Triggered | 429 responses > 50/min | P3 |

## 10.5 Backup Strategy

**Current Implementation**: Missing

**Recommended Production Setup**:

```yaml
# MySQL automatic backup
mysqldump:
  schedule: "0 2 * * *"  # 2 AM daily
  retention: 30 days
  destination: s3://ocrs-backups/

# Volume snapshot (Docker)
docker run --rm -v auth_db_data:/data \
  -v /backups:/backup \
  busybox tar czf /backup/auth-$(date +%Y%m%d).tar.gz /data
```

## 10.6 Disaster Recovery

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Single service failure | 5 min | 0 | Kubernetes/Docker restart |
| Database corruption | 1 hour | 24 hours | Restore from backup |
| Complete data center loss | 4 hours | 24 hours | Failover to DR region |

**Current Status**: No DR setup. Single point of failure.

---

# 11. Known Issues & Technical Debt

## 11.1 Critical Issues

| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| TD-001 | Hardcoded secrets | Critical | Migrate to Docker secrets or Vault |
| TD-002 | No input validation on Aadhaar | High | Add Verhoeff checksum validation |
| TD-003 | Missing ownership check on FIR view | High | Add userId check in controller |
| TD-004 | No database encryption at rest | Medium | Enable TDE on MySQL |

## 11.2 Performance Concerns

| Issue | Impact | Solution |
|-------|--------|----------|
| N+1 query on authority load balancing | Slow FIR filing | Add `@Query` with JOIN |
| No connection pooling config | DB bottleneck under load | Configure HikariCP |
| Synchronous email sending | Slow response | Use async with queue |

## 11.3 Missing Production Features

- [ ] Circuit breaker on Feign clients (configured but not tested)
- [ ] Distributed tracing (Zipkin/Jaeger)
- [ ] Centralized log aggregation (ELK/Loki)
- [ ] Database read replicas
- [ ] Blue-green deployment support
- [ ] API versioning

---

# 12. Appendices

## A. Environment Variables

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `JWT_SECRET` | Auth, Gateway | (hardcoded) | Token signing key |
| `JWT_EXPIRATION` | Auth | 3600000 | Access token TTL (ms) |
| `JWT_REFRESH_EXPIRATION` | Auth | 604800000 | Refresh token TTL (ms) |
| `GATEWAY_SECRET` | Gateway, Backend | (hardcoded) | Inter-service auth |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | All Java | localhost:8761 | Service registry URL |
| `REDIS_HOST` | Gateway | localhost | Rate limit store |
| `SMTP_HOST` | Email | live.smtp.mailtrap.io | Email server |
| `SMTP_USER` | Email | (required) | SMTP username |
| `SMTP_PASS` | Email | (required) | SMTP password |

## B. Docker Compose Quick Reference

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api-gateway

# Restart single service
docker-compose restart backend-monolith

# Scale (if configured)
docker-compose up -d --scale backend-monolith=2

# Cleanup
docker-compose down -v
```

## C. Common Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| 401 on all requests | JWT secret mismatch | Ensure same secret in auth-service and gateway |
| 403 on backend | Missing gateway secret | Check X-Gateway-Secret header |
| 500 on FIR file | Auth service unreachable | Check Eureka registration |
| Empty authority list | No active authorities | Create/activate authorities |
| Rate limit 429 | Too many requests | Wait or increase limits |

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-15
**Author**: Technical Documentation System
**Review Status**: Pending Security Review
