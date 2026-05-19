# QR Inventory Tracking & Analytics System — Backend API

Portfolio-grade backend for a QR-based inventory tracking system. Warehouse staff scan product QR codes via a mobile app; the backend logs scan events, enforces inventory movement rules, and powers analytics/KPI dashboards for admins.

**Tech stack:** NestJS, TypeScript, PostgreSQL, Prisma, JWT, Swagger

## Repositories
- Backend (this repo): `yasirraeesit/warelytics-backend`
- Client (web): `yasirraeesit/warelytics-client` (or rename your existing admin-dashboard repo)
- Mobile app: `yasirraeesit/warelytics-mobile-app`

## Core Features (Planned/Building)
- JWT authentication + role-based access control (ADMIN, MANAGER, OPERATOR, VIEWER)
- Product management (SKU, category, quantity, status, warehouse/zone/plant)
- Unique QR per product (stores a unique QR value, not a raw DB id)
- Scan event logging (SUCCESS / INVALID_QR / FAILED)
- Inventory movements:
  - STOCK_IN, STOCK_OUT, TRANSFER, DAMAGE, AUDIT_ADJUSTMENT
- Analytics endpoints for KPI cards + trends
- Alerts + exports (CSV/PDF) + export logs

## Backend Modules
- `auth`, `users`
- `products`, `qr-codes`
- `warehouses`, `zones`, `plants`
- `scan-events`, `inventory-movements`
- `analytics`, `alerts`, `exports`

## API Docs (Swagger)
- Swagger UI: `http://localhost:3001/api/docs`

## Local Setup
### Requirements
- Node.js (LTS recommended)
- Docker Desktop (recommended) OR PostgreSQL 15+

### Install
```bash
npm install
```

### Environment
Create `.env` from `.env.example` (added during implementation):
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `PORT=3001`

## Database Setup (PostgreSQL)
### Option A (Recommended): Docker Compose
From `warelytics/warelytics-backend`:
```bash
docker compose up -d
```

Then:
```bash
npm run prisma:generate
npm run db:migrate -- --name init
npm run db:seed
```

Default credentials used by `docker-compose.yml`:
- Host: `localhost`
- Port: `5432`
- DB: `warelytics`
- User: `postgres`
- Password: `postgres`

### Option B: Local PostgreSQL install
Create a database named `warelytics` and set `DATABASE_URL` in `.env`, then run:
```bash
npm run prisma:generate
npm run db:migrate -- --name init
npm run db:seed
```

### Run (dev)
```bash
npm run start:dev
```

## Seed Data
This repo will include a Prisma seed script generating realistic data:
- users (admin/managers/operators)
- 3 warehouses / 10 zones / 5 plants
- 100 products + QR codes
- 5,000 scan events across last 90 days
- 1,000 inventory movements
- audit mismatches, invalid QR scans, alerts

## Resume Highlights
- Event-driven domain modeling (scan events → movements → analytics)
- DB-level aggregation queries for KPIs and time-series trends
- Pagination + indexed filters for large datasets
- Secure JWT auth + RBAC guards

## RFID Upgrade (Future)
The QR scanning pipeline is designed so RFID can be added later via a new RFID ingestion module while reusing:
Products, Inventory Movements, Analytics, Alerts, and Dashboard UI.

## Project Plan
See `PROJECT.md`.
