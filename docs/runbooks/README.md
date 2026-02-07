# Operational Runbooks

## Overview

This document contains step-by-step operational procedures for managing the OCRS production environment. These runbooks are designed for DevOps engineers, SREs, and on-call staff.

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Incident Response](#incident-response)
3. [Service Recovery](#service-recovery)
4. [Database Operations](#database-operations)
5. [Scaling Procedures](#scaling-procedures)
6. [Backup & Restore](#backup--restore)
7. [SSL Certificate Management](#ssl-certificate-management)
8. [Log Management](#log-management)

---

## Daily Operations

### Morning Health Check

**Frequency**: Daily at 9:00 AM

```bash
# SSH into production server
ssh root@ocrs.ghagevaibhav.xyz

# Navigate to project
cd /opt/ocrs-project

# Run health check
./deploy/health-check.sh

# Check container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check resource usage
docker stats --no-stream

# Check disk space
df -h

# Check memory
free -m
```

**Expected Output**: All services showing "healthy" status, disk usage below 80%.

---

### Log Review

```bash
# View recent API Gateway logs
docker logs --tail 100 ocrs-api-gateway 2>&1 | grep -i error

# View Auth Service logs
docker logs --tail 100 ocrs-auth 2>&1 | grep -i error

# View Backend Service logs
docker logs --tail 100 ocrs-backend 2>&1 | grep -i error

# View Nginx access logs (last hour)
docker exec ocrs-nginx tail -100 /var/log/nginx/access.log
```

---

## Incident Response

### Runbook: Service Down

**Symptoms**: HTTP 503 errors, health check failures

**Step 1: Identify affected service**
```bash
# Check all services
docker ps -a

# Note services with status "Exited" or "Unhealthy"
```

**Step 2: Check service logs**
```bash
# Replace <service-name> with affected service
docker logs --tail 200 <service-name>
```

**Step 3: Attempt restart**
```bash
docker compose -f docker-compose.prod.yml restart <service-name>
```

**Step 4: If restart fails, recreate container**
```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate <service-name>
```

**Step 5: Verify recovery**
```bash
./deploy/health-check.sh
```

---

### Runbook: High CPU/Memory

**Symptoms**: Slow response times, Grafana alerts

**Step 1: Identify resource consumption**
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}\t{{.MemUsage}}"
```

**Step 2: For high memory - check for leaks**
```bash
# For Java services
docker exec <service-name> jcmd 1 VM.native_memory summary

# Force garbage collection (Java)
docker exec <service-name> jcmd 1 GC.run
```

**Step 3: Restart affected service**
```bash
docker compose -f docker-compose.prod.yml restart <service-name>
```

**Step 4: If persistent, check for application issues**
```bash
docker logs --since 1h <service-name> | grep -iE "(outofmemory|heap|gc)"
```

---

### Runbook: Database Connection Errors

**Symptoms**: "Connection refused" or timeout errors

**Step 1: Check database container**
```bash
docker ps -a | grep db
docker logs --tail 50 ocrs-auth-db
docker logs --tail 50 ocrs-backend-db
```

**Step 2: Verify database is accepting connections**
```bash
# Auth DB
docker exec ocrs-auth-db mysqladmin ping -h localhost -u root -p

# Backend DB
docker exec ocrs-backend-db mysqladmin ping -h localhost -u root -p
```

**Step 3: Check connection pool**
```bash
# Check active connections in MySQL
docker exec -it ocrs-auth-db mysql -u root -p -e "SHOW PROCESSLIST;"
```

**Step 4: Restart database if needed**
```bash
docker compose -f docker-compose.prod.yml restart ocrs-auth-db
docker compose -f docker-compose.prod.yml restart ocrs-backend-db

# Wait for databases to be ready
sleep 30

# Restart dependent services
docker compose -f docker-compose.prod.yml restart ocrs-auth ocrs-backend
```

---

### Runbook: JWT Authentication Failures

**Symptoms**: 401 errors, "INVALID_TOKEN" in logs

**Step 1: Verify JWT secret consistency**
```bash
# Check JWT secret in each service
docker exec ocrs-api-gateway env | grep JWT
docker exec ocrs-auth env | grep JWT
docker exec ocrs-backend env | grep JWT
```

**Step 2: Secrets must match across all services**

**Step 3: If secrets mismatch, update and restart**
```bash
# Edit .env.production
nano .env.production

# Restart services
docker compose -f docker-compose.prod.yml restart ocrs-api-gateway ocrs-auth ocrs-backend
```

---

## Service Recovery

### Full System Restart

```bash
cd /opt/ocrs-project

# Stop all services gracefully
docker compose -f docker-compose.prod.yml down

# Wait 10 seconds
sleep 10

# Start infrastructure first
docker compose -f docker-compose.prod.yml up -d eureka-server redis
sleep 30

# Start databases
docker compose -f docker-compose.prod.yml up -d ocrs-auth-db ocrs-backend-db
sleep 30

# Start application services
docker compose -f docker-compose.prod.yml up -d ocrs-auth ocrs-backend email-service logging-service
sleep 20

# Start gateway
docker compose -f docker-compose.prod.yml up -d ocrs-api-gateway
sleep 10

# Start frontend and nginx
docker compose -f docker-compose.prod.yml up -d ocrs-frontend ocrs-nginx

# Verify
./deploy/health-check.sh
```

---

### Rollback Deployment

```bash
cd /opt/ocrs-project

# View recent commits
git log --oneline -10

# Rollback to specific commit
git reset --hard <commit-hash>

# Rebuild and redeploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Verify
./deploy/health-check.sh
```

---

## Database Operations

### Connect to Database

```bash
# Auth Database
docker exec -it ocrs-auth-db mysql -u root -p

# Backend Database
docker exec -it ocrs-backend-db mysql -u root -p
```

### Backup Database

```bash
# Create backup directory
mkdir -p /opt/backups/$(date +%Y%m%d)

# Backup Auth DB
docker exec ocrs-auth-db mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" ocrs_auth > \
    /opt/backups/$(date +%Y%m%d)/auth_db_backup.sql

# Backup Backend DB
docker exec ocrs-backend-db mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" ocrs_backend > \
    /opt/backups/$(date +%Y%m%d)/backend_db_backup.sql

# Compress backups
cd /opt/backups/$(date +%Y%m%d)
gzip *.sql

# Verify backups
ls -lh
```

### Restore Database

```bash
# Decompress backup
gunzip auth_db_backup.sql.gz

# Restore Auth DB
docker exec -i ocrs-auth-db mysql -u root -p"${MYSQL_ROOT_PASSWORD}" ocrs_auth < auth_db_backup.sql

# Restart services
docker compose -f docker-compose.prod.yml restart ocrs-auth ocrs-backend
```

---

## Scaling Procedures

### Increase Service Resources

Edit `docker-compose.prod.yml` to adjust resource limits:

```yaml
services:
  ocrs-backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Increase from 1.0
          memory: 1024M    # Increase from 512M
        reservations:
          cpus: '1.0'
          memory: 512M
```

Apply changes:
```bash
docker compose -f docker-compose.prod.yml up -d ocrs-backend
```

---

## Backup & Restore

### Automated Daily Backup Script

```bash
#!/bin/bash
# /opt/scripts/daily_backup.sh

BACKUP_DIR="/opt/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Load environment
source /opt/ocrs-project/.env.production

# Backup databases
docker exec ocrs-auth-db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" ocrs_auth | gzip > "$BACKUP_DIR/auth_db.sql.gz"
docker exec ocrs-backend-db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" ocrs_backend | gzip > "$BACKUP_DIR/backend_db.sql.gz"

# Backup environment file
cp /opt/ocrs-project/.env.production "$BACKUP_DIR/env.backup"

# Backup Nginx config
cp /opt/ocrs-project/nginx/nginx.conf "$BACKUP_DIR/nginx.conf.backup"

# Remove backups older than 7 days
find /opt/backups -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR"
```

**Add to crontab**:
```bash
crontab -e
# Add line:
0 2 * * * /opt/scripts/daily_backup.sh >> /var/log/backup.log 2>&1
```

---

## SSL Certificate Management

### Check Certificate Expiry

```bash
# Check current certificate
echo | openssl s_client -servername ocrs.ghagevaibhav.xyz \
    -connect ocrs.ghagevaibhav.xyz:443 2>/dev/null | \
    openssl x509 -noout -dates
```

### Renew Certificate

```bash
cd /opt/ocrs-project

# Stop Nginx temporarily
docker compose -f docker-compose.prod.yml stop ocrs-nginx

# Renew certificate
docker run -it --rm \
    -v /etc/letsencrypt:/etc/letsencrypt \
    -v /var/www/certbot:/var/www/certbot \
    -p 80:80 \
    certbot/certbot renew

# Restart Nginx
docker compose -f docker-compose.prod.yml start ocrs-nginx

# Verify new certificate
echo | openssl s_client -servername ocrs.ghagevaibhav.xyz \
    -connect ocrs.ghagevaibhav.xyz:443 2>/dev/null | \
    openssl x509 -noout -dates
```

### Auto-Renewal Cron

```bash
# Add to crontab
0 3 * * 1 docker run --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot renew --quiet && docker restart ocrs-nginx
```

---

## Log Management

### View Real-time Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker logs -f ocrs-api-gateway
```

### Search Logs

```bash
# Find errors in last hour
docker logs --since 1h ocrs-backend 2>&1 | grep -i error

# Find specific FIR in logs
docker logs ocrs-backend 2>&1 | grep "FIR-ABC123"
```

### Log Rotation

Already configured in `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Export Logs for Analysis

```bash
# Export last 24h logs
docker logs --since 24h ocrs-backend > /tmp/backend_logs.txt 2>&1

# Compress
gzip /tmp/backend_logs.txt
```

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Project Lead | [Name] | [Phone/Email] |
| DevOps Engineer | [Name] | [Phone/Email] |
| Database Admin | [Name] | [Phone/Email] |

---

*Operational Runbooks for OCRS Project*
