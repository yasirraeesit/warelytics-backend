# QR Inventory Tracking & Analytics System — Project Plan

This file defines implementation phases, milestones, and a delivery timeline for a professional, portfolio-grade QR-based inventory tracking system.

**Product name:** QR Inventory Tracking & Analytics System  
**Repo:** `warelytics-backend` (API + DB + analytics)  
**Companion repos:** `warelytics-admin-dashboard`, `warelytics-mobile-app`

---

## Timeline (8 Weeks)

### Phase 0 — Kickoff & Foundations (Day 1–2)
**Outcome:** developer environment + baseline conventions.
- Define environment variables + `.env.example`
- Add Prisma baseline + DB connectivity checks
- Add Swagger, global validation pipe, exception filter
- Establish module structure and naming conventions
- CI basics (lint/typecheck/build) in GitHub Actions (optional but recommended)

**Deliverables**
- Running NestJS server
- Swagger available at `/api/docs`
- Prisma connected to Postgres

---

### Phase 1 — Auth, RBAC, Users (Week 1)
**Outcome:** secure login and role-protected endpoints.
- JWT login (access token)
- Password hashing (bcrypt)
- `RolesGuard` + `@Roles()` decorator
- User CRUD (admin/manager scope)
- Seed admin user + sample roles/users

**Acceptance**
- `POST /auth/login` works
- Protected route requires JWT
- Role checks enforced on admin-only endpoints

---

### Phase 2 — Master Data: Warehouses, Zones, Plants (Week 1–2)
**Outcome:** location hierarchy exists for inventory movements.
- CRUD: Warehouse, Zone, Plant
- Relations + validations
- Pagination + search

**Acceptance**
- List endpoints are paginated
- Users can assign products to locations

---

### Phase 3 — Products + QR Code Lifecycle (Week 2–3)
**Outcome:** products have a unique QR identifier and downloadable QR images.
- Product CRUD (SKU unique, status enum)
- `QrCode` model with unique `value` (never raw DB id)
- Generate QR (value + PNG) on product create
- Download QR image endpoint
- Admin-only regenerate QR endpoint (prevent duplicates)
- Product lookup by QR value

**Acceptance**
- Creating product creates QR code
- `GET /products/by-qr/:value` returns product
- Regenerate is ADMIN-only and preserves uniqueness

---

### Phase 4 — Scans + Inventory Movements Engine (Week 3–4)
**Outcome:** scanning logs + movement rules update inventory consistently.
- `ScanEvent` logging (SUCCESS / INVALID_QR / FAILED)
- Inventory movement creation:
  - STOCK_IN, STOCK_OUT, TRANSFER, DAMAGE, AUDIT_ADJUSTMENT
- Rules:
  - stock-out cannot go below zero
  - audit adjustment creates `StockAdjustment` record
  - transfer updates location + quantity rules
- Product movement timeline endpoint (movement + scans)

**Acceptance**
- Every scan attempt creates a `ScanEvent`
- Submitting a movement updates product quantity/location atomically

---

### Phase 5 — Analytics + KPI Aggregations (Week 4–5)
**Outcome:** dashboard-ready aggregated endpoints (DB-level aggregation).
- KPI endpoints:
  - totals (products, quantity)
  - scans today + success/invalid split
  - movements today by type
  - damaged quantity, audit mismatch count
- Trend endpoints:
  - daily scan trend (last 30/90 days)
  - invalid QR trend
  - stock in vs stock out trend
  - movement type breakdown
  - products by warehouse/plant
- Date range filters, indexed query paths, pagination where needed

**Acceptance**
- No endpoint loads large datasets into memory
- All list endpoints paginated

---

### Phase 6 — Alerts + Exports (Week 5–6)
**Outcome:** operational alerts and export jobs/logging.
- Alert rules:
  - invalid QR scan
  - repeated failed scans
  - stock below threshold
  - audit mismatch
  - damaged product
- Exports:
  - CSV export for scan logs and movements
  - KPI summary (PDF) (phase-able: start with JSON/CSV if PDF not ready)
- `ExportLog` persistence (status + who + filters + time)

**Acceptance**
- Creating export writes `ExportLog`
- Alerts visible via API and dashboard

---

### Phase 7 — Seed & Data Quality (Week 6–7)
**Outcome:** portfolio-grade dataset and realistic usage patterns.
- Seed data:
  - users (admin/managers/operators)
  - 3 warehouses / 10 zones / 5 plants
  - 100 products + QR codes
  - 5,000 scan events over last 90 days
  - 1,000 movements
  - audit mismatch records + invalid QR records + alerts
- Ensure referential integrity + plausible timelines

**Acceptance**
- Seed runs in < 2 minutes locally
- Dashboard charts render meaningful patterns

---

### Phase 8 — Hardening & Demo Readiness (Week 7–8)
**Outcome:** stable, documented, demo-ready system.
- Error handling, DTO validation coverage, consistent response shapes
- Rate limiting (optional)
- API docs polish (Swagger tags, examples)
- Docker Compose for local run (postgres + api)
- Final docs + demo instructions

**Acceptance**
- `npm run build` passes
- e2e smoke routes pass (or documented)
- Docker Compose boots reliably

---

## Milestones (Demo Checkpoints)
- **M1 (end Week 1):** auth + master data + Swagger
- **M2 (end Week 3):** products + QR generation + lookup
- **M3 (end Week 4):** movements engine + scan logs
- **M4 (end Week 5):** analytics KPIs + trends
- **M5 (end Week 7):** seed dataset + alerts + exports
- **M6 (end Week 8):** dockerized demo + polished docs

---

## RFID Upgrade Note (Future)
This system is designed so RFID can be added later by introducing an **RFID event ingestion module** that produces the same domain outputs:
- `ScanEvent`-like event records (RFID reads)
- reuse `Product`, `InventoryMovement`, `Analytics`, `Alerts`, `Exports`

