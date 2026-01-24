# OCRS - Online Crime Reporting System

A multi-service crime reporting platform enabling citizens to file FIRs and missing person reports, with authority management and admin analytics.

## Architecture

| Service | Technology | Port |
|---------|-----------|------|
| Auth Service | Spring Boot 3 | 8081 |
| Backend Monolith | Spring Boot 3 | 8080 |
| Email Service | Node.js/Express | 3000 |
| Logging Service | .NET 8 | 5000 |
| Frontend | React + Vite | 3001 |
| Database | MySQL 8 | 3306 |

## Quick Start

### Prerequisites
- JDK 17+
- Node.js 18+
- .NET 8 SDK
- MySQL 8+
- Docker (optional)

### Database Setup
```bash
mysql -u root -p < docs/schema.sql
```

### Run Services Locally

**1. Auth Service (Port 8081)**
```bash
cd auth-service
./mvnw spring-boot:run
```

**2. Backend Monolith (Port 8080)**
```bash
cd backend-monolith
./mvnw spring-boot:run
```

**3. Email Service (Port 3000)**
```bash
cd email-service
npm install
npm start
```

**4. Logging Service (Port 5000)**
```bash
cd logging-service
dotnet run
```

**5. Frontend (Port 3001)**
```bash
cd frontend
npm install
npm run dev
```

### Run with Docker
```bash
docker-compose up -d
```

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ocrs.gov.in | Admin@123 |
| Authority | officer1@police.gov.in | Auth@123 |
| User | testuser@gmail.com | User@123 |

## API Endpoints

### Auth Service
- `POST /api/auth/register/user` - Register citizen
- `POST /api/auth/login` - Login (all roles)

### User Endpoints
- `POST /api/user/fir` - File FIR
- `GET /api/user/firs` - Get my FIRs
- `POST /api/user/missing` - File missing person report

### Authority Endpoints
- `GET /api/authority/firs` - Get assigned FIRs
- `PUT /api/authority/fir/{id}/update` - Update FIR status

### Admin Endpoints
- `GET /api/admin/analytics` - Get analytics
- `PUT /api/admin/fir/{id}/reassign/{authorityId}` - Reassign FIR

## Environment Variables

Copy `.env.example` files and update:
- Database credentials
- JWT secret
- Mailtrap credentials (for email service)
