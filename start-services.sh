#!/bin/bash

# ocrs project startup script
# starts all services in background with logs

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"

# create logs directory
mkdir -p "$LOG_DIR"

echo "🚀 Starting OCRS Services..."
echo "================================"

# Initialize PIDs array
PIDS=()

# Function to handle cleanup on script interruption
cleanup() {
    echo ""
    echo "⚠️  Script interrupted. Stopping started services..."
    ./stop-services.sh
    exit 1
}

trap cleanup INT TERM

# function to check if port is available (used for services we start)
check_port_free() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $1 already in use. Please free it up."
        return 1
    fi
    return 0
}

# wait_for_port waits for a TCP port on a host to accept connections, printing progress and returning non-zero if a configurable timeout is reached.
wait_for_port() {
    local host=$1
    local port=$2
    local service=$3
    local max_retries=30
    local count=0

    echo -n "⏳ Waiting for $service ($host:$port)..."
    while ! nc -z $host $port >/dev/null 2>&1; do
        sleep 1
        count=$((count+1))
        if [ $count -ge $max_retries ]; then
            echo " ❌ Timed out!"
            return 1
        fi
        echo -n "."
    done
    echo " ✅ Ready!"
    return 0
}

# 0. Start Databases and Redis via Docker Compose
echo "🗄️  Starting Databases and Redis..."
if command -v docker >/dev/null 2>&1; then
    docker compose up -d auth-db backend-db redis
    if [ $? -eq 0 ]; then
        echo "   Docker containers started."
        wait_for_port localhost 3307 "Auth DB"
        wait_for_port localhost 3308 "Backend DB"
        wait_for_port localhost 6379 "Redis"
    else
        echo "❌ Failed to start Docker containers. Check docker status."
        exit 1
    fi
else
    echo "❌ Docker not found. Cannot start databases."
    exit 1
fi

echo ""

# 1. Start Eureka Server (port 8761)
check_port_free 8761 || exit 1
echo "📡 Starting Eureka Server (port 8761)..."
cd "$PROJECT_DIR/eureka-server"
mvn spring-boot:run -Dspring-boot.run.profiles=default > "$LOG_DIR/eureka-server.log" 2>&1 &
EUREKA_PID=$!
echo "   PID: $EUREKA_PID"
# Wait for Eureka to be somewhat ready
wait_for_port localhost 8761 "Eureka Server"
echo ""

# 2. Start Logging Service (c# - port 5000)
check_port_free 5000 || exit 1
echo "📝 Starting Logging Service (port 5000)..."
cd "$PROJECT_DIR/logging-service"
# Check if dotnet is available
if command -v dotnet >/dev/null 2>&1; then
    dotnet run > "$LOG_DIR/logging-service.log" 2>&1 &
    LOGGING_PID=$!
    echo "   PID: $LOGGING_PID"
else 
    echo "⚠️  dotnet not found. Skipping Logging Service."
    LOGGING_PID=""
fi
echo ""

# 3. Start Email Service (node.js - port 3000)
check_port_free 3000 || exit 1
echo "📧 Starting Email Service (port 3000)..."
cd "$PROJECT_DIR/email-service"
if command -v npm >/dev/null 2>&1; then
    npm start > "$LOG_DIR/email-service.log" 2>&1 &
    EMAIL_PID=$!
    echo "   PID: $EMAIL_PID"
else
    echo "⚠️  npm not found. Skipping Email Service."
    EMAIL_PID=""
fi
echo ""

# 4. Start Auth Service (java - port 8081)
# NOTE: Overriding DB URL to point to port 3307 for local run
check_port_free 8081 || exit 1
echo "🔐 Starting Auth Service (port 8081)..."
cd "$PROJECT_DIR/auth-service"
export SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3307/ocrs_auth"
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-DSPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL" > "$LOG_DIR/auth-service.log" 2>&1 &
AUTH_PID=$!
echo "   PID: $AUTH_PID"
echo ""

# 5. Start Backend Monolith (java - port 8080)
# NOTE: Backend DB is on port 3308 to avoid conflicts
check_port_free 8080 || exit 1
echo "⚙️  Starting Backend Monolith (port 8080)..."
cd "$PROJECT_DIR/backend-monolith"
export SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3308/ocrs_backend"
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-DSPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL" > "$LOG_DIR/backend-monolith.log" 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"
echo ""

# 6. Start API Gateway (java - port 8090)
check_port_free 8090 || exit 1
echo "🌐 Starting API Gateway (port 8090)..."
cd "$PROJECT_DIR/api-gateway"
# Wait for auth and backend services to register with Eureka
sleep 5
mvn spring-boot:run > "$LOG_DIR/api-gateway.log" 2>&1 &
GATEWAY_PID=$!
echo "   PID: $GATEWAY_PID"
echo ""

# 7. Start Frontend (react - port 5173)
check_port_free 5173
echo "🖥️  Starting Frontend (port 5173)..."
cd "$PROJECT_DIR/frontend"
if command -v npm >/dev/null 2>&1; then
    npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "   PID: $FRONTEND_PID"
else
    echo "⚠️  npm not found. Skipping Frontend."
    FRONTEND_PID=""
fi

# Save pids to file for stop script
# Only save available PIDs
PIDS_TO_SAVE=""
[ ! -z "$EUREKA_PID" ] && PIDS_TO_SAVE="$PIDS_TO_SAVE $EUREKA_PID"
[ ! -z "$LOGGING_PID" ] && PIDS_TO_SAVE="$PIDS_TO_SAVE $LOGGING_PID"
[ ! -z "$EMAIL_PID" ] && PIDS_TO_SAVE="$PIDS_TO_SAVE $EMAIL_PID"
[ ! -z "$AUTH_PID" ] && PIDS_TO_SAVE="$PIDS_TO_SAVE $AUTH_PID"
[ ! -z "$BACKEND_PID" ] && PIDS_TO_SAVE="$PIDS_TO_SAVE $BACKEND_PID"
[ ! -z "$GATEWAY_PID" ] && PIDS_TO_SAVE="$PIDS_TO_SAVE $GATEWAY_PID"
[ ! -z "$FRONTEND_PID" ] && PIDS_TO_SAVE="$PIDS_TO_SAVE $FRONTEND_PID"

echo "$PIDS_TO_SAVE" > "$LOG_DIR/pids.txt"

echo ""
echo "================================"
echo "✅ Startup sequence initiated!"
echo ""
echo "📍 URLs:"
echo "   Eureka:      http://localhost:8761"
echo "   API Gateway: http://localhost:8090 (main entry point)"
echo "   Frontend:    http://localhost:5173"
echo "   Auth API:    http://localhost:8081/api/auth/health"
echo "   Backend:     http://localhost:8080/api/health"
echo "   Logging:     http://localhost:5000/api/logs/health"
echo "   Email:       http://localhost:3000/health"
echo "   Redis:       localhost:6379 (rate limiting)"
echo ""
echo "📋 Logs: $LOG_DIR/"
echo "🛑 To stop: ./stop-services.sh"
echo ""
