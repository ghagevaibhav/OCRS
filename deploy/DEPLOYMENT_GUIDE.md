# OCRS Deployment Guide - DigitalOcean

Complete step-by-step guide to deploy OCRS to DigitalOcean.

## Prerequisites

- DigitalOcean account
- Domain (`ghagevaibhav.xyz`) with DNS access
- Git repository with OCRS code
- SMTP credentials (Mailtrap)

---

## Step 1: Create DigitalOcean Droplet (~5 min)

1. **Log into DigitalOcean** → Create → Droplets

2. **Configure Droplet:**
   | Setting | Value |
   |---------|-------|
   | Image | Ubuntu 22.04 LTS |
   | Plan | Basic → Regular → **$48/mo** (8GB RAM, 4 vCPU) |
   | Region | **Bangalore (blr1)** |
   | Authentication | SSH Key (recommended) |
   | Hostname | `ocrs-production` |

3. **Enable backups** (optional, +$9.60/mo)

4. **Create Droplet** and note the IP address

---

## Step 2: Configure DNS (~5 min)

Add DNS A record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | ocrs | `<droplet-ip>` | 3600 |

This creates: `ocrs.ghagevaibhav.xyz` → `<droplet-ip>`

**Wait 5-15 minutes** for DNS propagation.

---

## Step 3: Setup Droplet (~10 min)

```bash
# SSH into droplet
ssh root@<droplet-ip>

# Download and run setup script (or copy manually)
curl -fsSL https://raw.githubusercontent.com/<your-repo>/main/deploy/setup.sh | bash

# Or clone repo first and run
git clone https://github.com/<your-username>/ocrs-project.git /opt/ocrs/app
cd /opt/ocrs/app
bash deploy/setup.sh
```

---

## Step 4: Configure Environment (~5 min)

```bash
cd /opt/ocrs/app

# Copy environment template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required values:**
```bash
MYSQL_ROOT_PASSWORD=<strong-password>
JWT_SECRET=<generate-with: openssl rand -base64 64>
SMTP_USER=<mailtrap-username>
SMTP_PASS=<mailtrap-password>
GRAFANA_PASSWORD=<grafana-admin-password>
```

---

## Step 5: Deploy Application (~10 min)

```bash
cd /opt/ocrs/app

# First deployment (builds all images)
bash deploy/deploy.sh --build

# Monitor startup
docker compose -f docker-compose.prod.yml logs -f
```

Wait for all services to start (2-3 minutes). Check status:
```bash
bash deploy/health-check.sh
```

---

## Step 6: Configure SSL (~5 min)

**Ensure DNS is propagated first:**
```bash
nslookup ocrs.ghagevaibhav.xyz
```

**Run SSL setup:**
```bash
bash deploy/ssl-setup.sh
```

---

## Step 7: Verify Deployment

### Access Points

| Service | URL |
|---------|-----|
| **Frontend** | https://ocrs.ghagevaibhav.xyz |
| **API** | https://ocrs.ghagevaibhav.xyz/api/ |
| **Grafana** | http://`<ip>`:3002 (login: admin / your-password) |
| **Prometheus** | http://`<ip>`:9090 |
| **Eureka** | http://`<ip>`:8761 |

### Test Checklist

- [ ] Homepage loads with HTTPS
- [ ] User registration works
- [ ] Login/logout works
- [ ] FIR filing works
- [ ] Email notifications received
- [ ] Grafana shows metrics

---

## Common Commands

```bash
# View all container status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f <service-name>

# Restart a service
docker compose -f docker-compose.prod.yml restart <service-name>

# Rebuild and redeploy
bash deploy/deploy.sh --build

# Stop all services
docker compose -f docker-compose.prod.yml down

# Remove everything including volumes (DANGER!)
docker compose -f docker-compose.prod.yml down -v
```

---

## Troubleshooting

### Service won't start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs <service-name>

# Check resources
htop
df -h
```

### Database connection issues
```bash
# Check MySQL is running
docker exec -it ocrs-auth-db mysql -u root -p

# Check environment variables
docker inspect ocrs-auth | grep -A 20 "Env"
```

### SSL certificate issues
```bash
# Check certificate
docker compose -f docker-compose.prod.yml logs certbot

# Manual renewal
docker compose -f docker-compose.prod.yml run --rm certbot renew
```

---

## Maintenance

### Update Application
```bash
cd /opt/ocrs/app
git pull origin main
bash deploy/deploy.sh --build
```

### Backup Database
```bash
docker exec ocrs-auth-db mysqldump -u root -p ocrs_auth > backup_auth_$(date +%Y%m%d).sql
docker exec ocrs-backend-db mysqldump -u root -p ocrs_backend > backup_backend_$(date +%Y%m%d).sql
```

### View Resource Usage
```bash
docker stats
```
