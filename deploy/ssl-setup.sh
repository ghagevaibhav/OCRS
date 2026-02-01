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
EMAIL="ghagevaibhav@gmail.com"

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
# Check if nginx is running
# -----------------------------------------------------------------------------
print_step "Checking nginx status..."

# Use docker ps to check if container exists and is running (works with all docker versions)
if ! docker ps --format '{{.Names}}' | grep -q "ocrs-nginx"; then
    print_error "Nginx container is not running!"
    echo "Run deploy.sh first to start the services."
    exit 1
fi

echo -e "${GREEN}✓${NC} Nginx is running"

# -----------------------------------------------------------------------------
# Ensure initial nginx config is in use (HTTP only for Let's Encrypt challenge)
# -----------------------------------------------------------------------------
print_step "Ensuring HTTP-only nginx config is active..."
cp nginx/nginx.initial.conf nginx/nginx.conf
docker compose -f docker-compose.prod.yml restart nginx 2>/dev/null || docker-compose -f docker-compose.prod.yml restart nginx
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
    -d "$DOMAIN" 2>/dev/null || \
docker-compose -f docker-compose.prod.yml run --rm certbot \
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
# Create SSL-enabled nginx config
# -----------------------------------------------------------------------------
print_step "Creating HTTPS nginx configuration..."

cat > nginx/nginx.conf << 'NGINX_SSL_CONF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Upstreams
    upstream api_gateway {
        server api-gateway:8090;
    }

    upstream frontend {
        server frontend:80;
    }

    # HTTP - redirect to HTTPS
    server {
        listen 80;
        server_name ocrs.ghagevaibhav.xyz;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS
    server {
        listen 443 ssl http2;
        server_name ocrs.ghagevaibhav.xyz;

        ssl_certificate /etc/letsencrypt/live/ocrs.ghagevaibhav.xyz/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/ocrs.ghagevaibhav.xyz/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api_gateway;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 'OK';
            add_header Content-Type text/plain;
        }
    }
}
NGINX_SSL_CONF

# -----------------------------------------------------------------------------
# Restart nginx with SSL config
# -----------------------------------------------------------------------------
print_step "Restarting nginx with SSL..."
docker compose -f docker-compose.prod.yml restart nginx 2>/dev/null || docker-compose -f docker-compose.prod.yml restart nginx
sleep 5

# -----------------------------------------------------------------------------
# Verify HTTPS
# -----------------------------------------------------------------------------
print_step "Verifying HTTPS..."

sleep 3
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/health" 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}✓${NC} HTTPS is working!"
else
    print_warning "HTTPS verification pending. Testing with curl..."
    curl -kI "https://$DOMAIN" 2>/dev/null | head -3
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
