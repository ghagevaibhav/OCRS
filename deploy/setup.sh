#!/bin/bash
# =============================================================================
# OCRS Droplet Setup Script
# =============================================================================
# Run this script on a fresh Ubuntu 22.04 DigitalOcean Droplet
# Usage: bash setup.sh
# =============================================================================

set -e

echo "=========================================="
echo "OCRS Droplet Setup Script"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# -----------------------------------------------------------------------------
# Update system packages
# -----------------------------------------------------------------------------
print_step "Updating system packages..."
apt-get update && apt-get upgrade -y

# -----------------------------------------------------------------------------
# Install Docker
# -----------------------------------------------------------------------------
print_step "Installing Docker..."
apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

print_step "Docker installed successfully!"
docker --version
docker compose version

# -----------------------------------------------------------------------------
# Install additional tools
# -----------------------------------------------------------------------------
print_step "Installing additional tools..."
apt-get install -y git htop vim curl wget unzip

# -----------------------------------------------------------------------------
# Configure Firewall (UFW)
# -----------------------------------------------------------------------------
print_step "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

print_step "Firewall configured!"
ufw status

# -----------------------------------------------------------------------------
# Create app directory
# -----------------------------------------------------------------------------
print_step "Creating application directory..."
mkdir -p /opt/ocrs
cd /opt/ocrs

# -----------------------------------------------------------------------------
# Configure swap (recommended for 4GB droplets)
# -----------------------------------------------------------------------------
print_step "Configuring swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    print_step "Swap configured (2GB)"
else
    print_warning "Swap already exists, skipping..."
fi

# -----------------------------------------------------------------------------
# Configure Docker log rotation
# -----------------------------------------------------------------------------
print_step "Configuring Docker log rotation..."
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

# -----------------------------------------------------------------------------
# Create directories for certbot
# -----------------------------------------------------------------------------
print_step "Creating SSL directories..."
mkdir -p /opt/ocrs/certbot/www
mkdir -p /opt/ocrs/certbot/conf

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository to /opt/ocrs"
echo "   git clone <your-repo-url> /opt/ocrs/app"
echo ""
echo "2. Copy .env.production.example to .env.production and fill in values"
echo "   cp /opt/ocrs/app/.env.production.example /opt/ocrs/app/.env.production"
echo ""
echo "3. Run the deploy script"
echo "   cd /opt/ocrs/app && bash deploy/deploy.sh"
echo ""
