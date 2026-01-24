#!/bin/bash

# ocrs project startup script
# starts all services in background with logs

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"

# create logs directory
mkdir -p "$LOG_DIR"

echo "🚀 Starting OCRS Services..."
echo "================================"

# function to check if port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $1 already in use"
        return 1
    fi
    return 0
}

# 1. start logging service (c# - port 5000)
echo "📝 Starting Logging Service (port 5000)..."
cd "$PROJECT_DIR/logging-service"
dotnet run > "$LOG_DIR/logging-service.log" 2>&1 &
LOGGING_PID=$!
echo "   PID: $LOGGING_PID"

sleep 2

# 2. start email service (node.js - port 3000)
echo "📧 Starting Email Service (port 3000)..."
cd "$PROJECT_DIR/email-service"
npm start > "$LOG_DIR/email-service.log" 2>&1 &
EMAIL_PID=$!
echo "   PID: $EMAIL_PID"

sleep 2

# 3. start auth service (java - port 8081)
echo "🔐 Starting Auth Service (port 8081)..."
cd "$PROJECT_DIR/auth-service"
mvn spring-boot:run -q > "$LOG_DIR/auth-service.log" 2>&1 &
AUTH_PID=$!
echo "   PID: $AUTH_PID"

sleep 5

# 4. start backend monolith (java - port 8080)
echo "⚙️  Starting Backend Monolith (port 8080)..."
cd "$PROJECT_DIR/backend-monolith"
mvn spring-boot:run -q > "$LOG_DIR/backend-monolith.log" 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"

sleep 5

# 5. start frontend (react - port 5173)
echo "🌐 Starting Frontend (port 5173)..."
cd "$PROJECT_DIR/frontend"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

# save pids to file for stop script
echo "$LOGGING_PID $EMAIL_PID $AUTH_PID $BACKEND_PID $FRONTEND_PID" > "$LOG_DIR/pids.txt"

echo ""
echo "================================"
echo "✅ All services starting!"
echo ""
echo "📍 URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Auth API:  http://localhost:8081/api/auth/health"
echo "   Backend:   http://localhost:8080/api/health"
echo "   Logging:   http://localhost:5000/api/logs/health"
echo "   Email:     http://localhost:3000/health"
echo ""
echo "📋 Logs: $LOG_DIR/"
echo "🛑 To stop: ./stop-services.sh"
echo ""
