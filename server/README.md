# Atelier VPS Backend & PostgreSQL Database Setup Guide

This package provides a **Dockerized PostgreSQL 16 database** and **Express Sync Bridge API** for synchronizing Atelier Desktop and the Cloudflare Telegram Companion Bot.

---

## 1. Quick Start on VPS (One Command)

### Prerequisites:
- A Linux VPS (Ubuntu 20.04/22.04 or Debian)
- Docker & Docker Compose installed:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  ```

### Deployment Steps:
1. Clone your Atelier repository or copy the `server/` directory to your VPS:
   ```bash
   git clone https://github.com/Unalome7431/Atelier---Productivity-Desktop-App.git atelier
   cd atelier/server
   ```

2. Copy the environment file and configure your credentials:
   ```bash
   cp .env.example .env
   nano .env
   ```
   *Set a secure password for `POSTGRES_PASSWORD` and secret string for `SYNC_API_KEY`.*

3. Start the database and sync server:
   ```bash
   docker compose up -d
   ```

4. Verify health status:
   ```bash
   curl http://localhost:3001/health
   # Response: {"status":"ok","database":"connected","timestamp":"..."}
   ```

---

## 2. Nginx Reverse Proxy with SSL (Optional Domain Setup)

To access your sync bridge securely from outside over HTTPS:

```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable SSL using Let's Encrypt:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

---

## 3. Database Connection String for Cloudflare Telegram Worker

To connect your Cloudflare Worker directly to this VPS database:

```text
postgres://atelier_user:<YOUR_PASSWORD>@<YOUR_VPS_IP>:5432/atelier
```

In your Cloudflare Worker directory:
```bash
npx wrangler secret put DATABASE_URL
```

---

## 4. API Endpoints

- `GET /health` — Verifies database connection.
- `GET /api/sync/snapshot` (Requires `Authorization: Bearer <SYNC_API_KEY>`) — Returns full workspace state.
- `POST /api/sync/push` (Requires `Authorization: Bearer <SYNC_API_KEY>`) — Ingests client mutation queue.
