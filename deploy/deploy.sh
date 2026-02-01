#!/bin/bash
# =============================================================================
# OCRS Deployment Script
# =============================================================================
# Deploy or update the OCRS application using Docker Compose
# Usage: bash deploy.sh [--build] [--pull]
# =============================================================================

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
BUILD=false
PULL=false
for arg in "$@"; do
    case $arg in
        --build) BUILD=true ;;
        --pull) PULL=true ;;
    esac
done

echo "=========================================="
echo "OCRS Deployment Script"
echo "=========================================="
echo "Project directory: $PROJECT_DIR"
echo ""

# -----------------------------------------------------------------------------
# Check prerequisites
# -----------------------------------------------------------------------------
print_step "Checking prerequisites..."

if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    echo "Copy .env.production.example to .env.production and fill in the values."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed!"
    exit 1
fi

# Load environment variables
set -a
source .env.production
set +a

# -----------------------------------------------------------------------------
# Pull latest code (if in git repo)
# -----------------------------------------------------------------------------
if [ "$PULL" = true ] && [ -d ".git" ]; then
    print_step "Pulling latest code..."
    git pull origin main
fi

# -----------------------------------------------------------------------------
# Use initial nginx config if SSL not set up yet
# -----------------------------------------------------------------------------
if [ ! -f "certbot/conf/live/ocrs.ghagevaibhav.xyz/fullchain.pem" ]; then
    print_warning "SSL certificates not found. Using initial nginx config (HTTP only)."
    print_warning "Run ssl-setup.sh after deployment to configure HTTPS."
    cp nginx/nginx.initial.conf nginx/nginx.conf
fi

# -----------------------------------------------------------------------------
# Build and deploy
# -----------------------------------------------------------------------------
if [ "$BUILD" = true ]; then
    print_step "Building Docker images..."
    docker compose -f docker-compose.prod.yml --env-file .env.production build
fi

print_step "Starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# -----------------------------------------------------------------------------
# Wait for services to be healthy
# -----------------------------------------------------------------------------
print_step "Waiting for services to start (this may take 2-3 minutes)..."
sleep 30

# Check service status
print_step "Checking service status..."
docker compose -f docker-compose.prod.yml ps

# -----------------------------------------------------------------------------
# Health checks
# -----------------------------------------------------------------------------
print_step "Running health checks..."

# Check if containers are running
RUNNING=$(docker compose -f docker-compose.prod.yml ps --status running -q | wc -l)
EXPECTED=12  # All services including monitoring

if [ "$RUNNING" -lt 8 ]; then
    print_warning "Only $RUNNING containers running. Expected at least 8."
    echo "Checking logs for issues..."
    docker compose -f docker-compose.prod.yml logs --tail=20
else
    echo -e "${GREEN}✓${NC} $RUNNING containers running"
fi

# Check Eureka
if curl -s http://localhost:8761/actuator/health | grep -q '"status":"UP"'; then
    echo -e "${GREEN}✓${NC} Eureka Server is healthy"
else
    print_warning "Eureka Server may still be starting..."
fi

# Check API Gateway
if curl -s http://localhost:8090/actuator/health | grep -q '"status":"UP"'; then
    echo -e "${GREEN}✓${NC} API Gateway is healthy"
else
    print_warning "API Gateway may still be starting..."
fi

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Services are accessible at:"
echo "  - Frontend:    http://$(hostname -I | awk '{print $1}')"
echo "  - API Gateway: http://$(hostname -I | awk '{print $1}'):8090"
echo "  - Eureka:      http://$(hostname -I | awk '{print $1}'):8761"
echo "  - Prometheus:  http://$(hostname -I | awk '{print $1}'):9090"
echo "  - Grafana:     http://$(hostname -I | awk '{print $1}'):3002"
echo ""
echo "Next steps:"
echo "  1. Configure DNS A record: ocrs.ghagevaibhav.xyz -> $(hostname -I | awk '{print $1}')"
echo "  2. Run: bash deploy/ssl-setup.sh to enable HTTPS"
echo ""
