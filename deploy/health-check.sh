#!/bin/bash
# =============================================================================
# OCRS Health Check Script
# =============================================================================
# Run health checks on all services
# Usage: bash health-check.sh
# =============================================================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "OCRS Health Check"
echo "=========================================="
echo ""

check_service() {
    local name=$1
    local url=$2
    local expected=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} $name is healthy (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗${NC} $name is unhealthy (HTTP $response, expected $expected)"
        return 1
    fi
}

# Check Docker containers
echo "Docker Containers:"
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || \
docker-compose -f docker-compose.prod.yml ps 2>/dev/null

echo ""
echo "Service Health Checks:"
echo "--------------------------------------"

# Core services
check_service "Eureka Server" "http://localhost:8761/actuator/health" "200"
check_service "API Gateway" "http://localhost:8090/actuator/health" "200"
check_service "Auth Service" "http://localhost:8081/actuator/health" "200"
check_service "Backend Service" "http://localhost:8080/actuator/health" "200"
check_service "Frontend" "http://localhost:3001" "200"

# Infrastructure
check_service "Redis" "http://localhost:6379" "000" 2>/dev/null || \
    echo -e "${YELLOW}○${NC} Redis (no HTTP endpoint, checking via docker...)" && \
    docker exec ocrs-redis redis-cli ping 2>/dev/null | grep -q PONG && \
    echo -e "${GREEN}✓${NC} Redis is healthy" || echo -e "${RED}✗${NC} Redis is unhealthy"

# Monitoring (if enabled)
check_service "Prometheus" "http://localhost:9090/-/healthy" "200" 2>/dev/null || true
check_service "Grafana" "http://localhost:3002/api/health" "200" 2>/dev/null || true

echo ""
echo "--------------------------------------"

# Check Eureka registered services
echo ""
echo "Eureka Registered Services:"
curl -s http://localhost:8761/eureka/apps 2>/dev/null | grep -oP '(?<=<application>).*?(?=</application>)' | head -10 || echo "Could not fetch Eureka apps"

echo ""
echo "=========================================="
