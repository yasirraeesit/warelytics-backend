# Prisma

## Setup
1) Create `.env` with `DATABASE_URL=postgresql://...`
2) Run:
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

## Seed Notes
The seed script generates:
- Users (admin/managers/operators)
- Warehouses/Zones/Plants
- Products + unique QR values
- Scan events (including invalid QR)
- Inventory movements + audit adjustments
- Sample alerts

