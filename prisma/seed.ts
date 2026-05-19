import { PrismaClient, Role, ProductStatus, ScanStatus, InventoryMovementType } from '@prisma/client';
import dayjs from 'dayjs';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uuidLike(prefix: string) {
  return `${prefix}_${crypto.randomBytes(10).toString('hex')}`;
}

async function main() {
  const now = dayjs();
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await prisma.scanEvent.deleteMany();
  await prisma.stockAdjustment.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.qrCode.deleteMany();
  await prisma.product.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@warelytics.local',
      name: 'Admin User',
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const managers = await prisma.user.createManyAndReturn({
    data: [
      { email: 'manager1@warelytics.local', name: 'Manager One', role: Role.MANAGER, passwordHash },
      { email: 'manager2@warelytics.local', name: 'Manager Two', role: Role.MANAGER, passwordHash },
    ],
  });

  const operators = await prisma.user.createManyAndReturn({
    data: Array.from({ length: 5 }).map((_, i) => ({
      email: `operator${i + 1}@warelytics.local`,
      name: `Operator ${i + 1}`,
      role: Role.OPERATOR,
      passwordHash,
    })),
  });

  const users = [admin, ...managers, ...operators];

  const warehouses = await prisma.warehouse.createManyAndReturn({
    data: [
      { code: 'WH-KHI', name: 'Karachi Main Warehouse' },
      { code: 'WH-LHE', name: 'Lahore Distribution Center' },
      { code: 'WH-ISB', name: 'Islamabad Hub' },
    ],
  });

  const plants = await prisma.plant.createManyAndReturn({
    data: [
      { code: 'PLT-01', name: 'Plant 01' },
      { code: 'PLT-02', name: 'Plant 02' },
      { code: 'PLT-03', name: 'Plant 03' },
      { code: 'PLT-04', name: 'Plant 04' },
      { code: 'PLT-05', name: 'Plant 05' },
    ],
  });

  const zoneRows: { code: string; name: string; warehouseId: string }[] = [];
  for (const wh of warehouses) {
    for (let i = 1; i <= 4; i++) {
      zoneRows.push({ code: `Z${i}`, name: `Zone ${i}`, warehouseId: wh.id });
    }
  }
  // total 12 zones; requirement says 10 – we'll trim to 10 deterministically
  const zones = await prisma.zone.createManyAndReturn({
    data: zoneRows.slice(0, 10),
  });

  const categories = ['Electronics', 'Automotive', 'Consumables', 'Packaging', 'Spare Parts'];

  const products = await prisma.product.createManyAndReturn({
    data: Array.from({ length: 100 }).map((_, i) => {
      const warehouse = pick(warehouses);
      const zone = pick(zones.filter((z) => z.warehouseId === warehouse.id).concat(zones));
      const plant = Math.random() < 0.8 ? pick(plants) : null;
      return {
        sku: `SKU-${String(i + 1).padStart(4, '0')}`,
        name: `Product ${i + 1}`,
        category: pick(categories),
        description: `Seeded product ${i + 1} for demos.`,
        quantity: randInt(0, 500),
        status: pick([ProductStatus.ACTIVE, ProductStatus.ACTIVE, ProductStatus.ACTIVE, ProductStatus.DAMAGED]),
        warehouseId: warehouse.id,
        zoneId: zone?.id,
        plantId: plant?.id,
      };
    }),
  });

  for (const p of products) {
    await prisma.qrCode.create({
      data: {
        productId: p.id,
        value: uuidLike('QR'),
      },
    });
  }

  // Create movements + scan events across last 90 days.
  const movementTypes: InventoryMovementType[] = [
    InventoryMovementType.STOCK_IN,
    InventoryMovementType.STOCK_OUT,
    InventoryMovementType.TRANSFER,
    InventoryMovementType.DAMAGE,
    InventoryMovementType.AUDIT_ADJUSTMENT,
  ];

  const productQr = await prisma.product.findMany({
    select: { id: true, warehouseId: true, zoneId: true, plantId: true, qrCode: { select: { value: true } } },
  });

  const movementIds: string[] = [];
  for (let i = 0; i < 1000; i++) {
    const p = pick(productQr);
    const mType = pick(movementTypes);
    const createdAt = now.subtract(randInt(0, 89), 'day').subtract(randInt(0, 23), 'hour').toDate();
    const qty = randInt(1, 50);

    const movement = await prisma.inventoryMovement.create({
      data: {
        productId: p.id,
        movementType: mType,
        quantity: qty,
        remarks: Math.random() < 0.3 ? 'Seeded movement' : null,
        createdAt,
        fromWarehouseId: p.warehouseId,
        fromZoneId: p.zoneId,
        fromPlantId: p.plantId,
        toWarehouseId: mType === InventoryMovementType.TRANSFER ? pick(warehouses).id : null,
        toZoneId: null,
        toPlantId: null,
      },
    });
    movementIds.push(movement.id);

    if (mType === InventoryMovementType.AUDIT_ADJUSTMENT && Math.random() < 0.4) {
      const systemQty = randInt(0, 500);
      const countedQty = Math.max(0, systemQty + randInt(-30, 30));
      await prisma.stockAdjustment.create({
        data: {
          productId: p.id,
          movementId: movement.id,
          systemQuantity: systemQty,
          countedQuantity: countedQty,
          variance: countedQty - systemQty,
        },
      });
    }
  }

  for (let i = 0; i < 5000; i++) {
    const isInvalid = Math.random() < 0.06;
    const p = pick(productQr);
    const scannedAt = now.subtract(randInt(0, 89), 'day').subtract(randInt(0, 23), 'hour').subtract(randInt(0, 59), 'minute').toDate();
    const scannedBy = pick(users);

    const movementId = Math.random() < 0.25 ? pick(movementIds) : null;
    const actionType = movementId ? pick(movementTypes) : null;

    await prisma.scanEvent.create({
      data: {
        qrCodeValue: isInvalid ? uuidLike('INVALID') : (p.qrCode?.value ?? uuidLike('QR')),
        scanStatus: isInvalid ? ScanStatus.INVALID_QR : ScanStatus.SUCCESS,
        scannedAt,
        scannedById: scannedBy.id,
        productId: isInvalid ? null : p.id,
        warehouseId: p.warehouseId,
        zoneId: p.zoneId,
        plantId: p.plantId,
        actionType,
        movementId,
        remarks: isInvalid ? 'Invalid QR scanned' : null,
      },
    });
  }

  // Alerts
  const scanEvents = await prisma.scanEvent.findMany({ take: 200, orderBy: { scannedAt: 'desc' } });
  for (const se of scanEvents) {
    if (se.scanStatus === ScanStatus.INVALID_QR && Math.random() < 0.3) {
      await prisma.alert.create({
        data: {
          type: 'INVALID_QR_SCAN',
          message: `Invalid QR scanned: ${se.qrCodeValue}`,
          productId: se.productId,
          scanEventId: se.id,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
