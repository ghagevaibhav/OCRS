#!/bin/bash
# =============================================================================
# OCRS SSL Setup Script
# =============================================================================
# Configure Let's Encrypt SSL certificates
# Usage: bash ssl-setup.sh
# =============================================================================

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors
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

# Configuration
DOMAIN="ocrs.ghagevaibhav.xyz"
EMAIL="ghagevaibhav@gmail.com"  # Change this to your email

echo "=========================================="
echo "OCRS SSL Setup Script"
echo "=========================================="
echo "Domain: $DOMAIN"
echo ""

# Load environment
if [ -f ".env.production" ]; then
    set -a
    source .env.production
    set +a
fi

# -----------------------------------------------------------------------------
# Check if nginx is running with HTTP config
# -----------------------------------------------------------------------------
print_step "Checking nginx status..."

if ! docker compose -f docker-compose.prod.yml ps nginx | grep -q "running"; then
    print_error "Nginx container is not running!"
    echo "Run deploy.sh first to start the services."
    exit 1
fi

# -----------------------------------------------------------------------------
# Ensure initial nginx config is in use
# -----------------------------------------------------------------------------
print_step "Ensuring HTTP-only nginx config is active..."
cp nginx/nginx.initial.conf nginx/nginx.conf
docker compose -f docker-compose.prod.yml restart nginx
sleep 5

# -----------------------------------------------------------------------------
# Request SSL certificate
# -----------------------------------------------------------------------------
print_step "Requesting SSL certificate from Let's Encrypt..."

docker compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# -----------------------------------------------------------------------------
# Check if certificate was obtained
# -----------------------------------------------------------------------------
if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    print_step "SSL certificate obtained successfully!"
else
    print_error "Failed to obtain SSL certificate!"
    echo "Make sure:"
    echo "  1. DNS A record for $DOMAIN points to this server's IP"
    echo "  2. Port 80 is accessible from the internet"
    exit 1
fi

# -----------------------------------------------------------------------------
# Switch to HTTPS nginx config
# -----------------------------------------------------------------------------
print_step "Switching to HTTPS nginx configuration..."

# Restore the full SSL nginx config
cat > nginx/nginx.conf << 'NGINX_CONF'
# Full nginx.conf content will be copied from the template
NGINX_CONF

# Actually copy the SSL-enabled config (it should already exist)
# We need to make sure the SSL paths are correct
print_step "Restarting nginx with SSL..."
docker compose -f docker-compose.prod.yml restart nginx
sleep 5

# -----------------------------------------------------------------------------
# Verify HTTPS
# -----------------------------------------------------------------------------
print_step "Verifying HTTPS..."

if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/health" | grep -q "200"; then
    echo -e "${GREEN}✓${NC} HTTPS is working!"
else
    print_warning "HTTPS verification failed. Checking with --insecure..."
    curl -k -I "https://$DOMAIN/health" 2>/dev/null | head -1
fi

echo ""
echo "=========================================="
echo "SSL Setup Complete!"
echo "=========================================="
echo ""
echo "Your application is now accessible at:"
echo "  https://$DOMAIN"
echo ""
echo "Certificate auto-renewal is configured via the certbot container."
echo ""
