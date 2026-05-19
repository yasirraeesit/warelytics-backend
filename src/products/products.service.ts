import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import crypto from 'crypto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

function generateQrValue() {
  return `QR_${crypto.randomBytes(16).toString('hex')}`;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
    if (!warehouse) throw new BadRequestException('Invalid warehouseId');

    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({ where: { id: dto.zoneId } });
      if (!zone) throw new BadRequestException('Invalid zoneId');
      if (zone.warehouseId !== dto.warehouseId)
        throw new BadRequestException('zoneId does not belong to warehouseId');
    }

    if (dto.plantId) {
      const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
      if (!plant) throw new BadRequestException('Invalid plantId');
    }

    for (let i = 0; i < 5; i++) {
      const qrValue = generateQrValue();
      try {
        return await this.prisma.product.create({
          data: {
            sku: dto.sku,
            name: dto.name,
            category: dto.category,
            description: dto.description,
            quantity: dto.quantity,
            status: dto.status,
            warehouseId: dto.warehouseId,
            zoneId: dto.zoneId,
            plantId: dto.plantId,
            qrCode: { create: { value: qrValue } },
          },
          include: { qrCode: true },
        });
      } catch (e: any) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          // Unique collision on SKU or QR; retry once for QR collisions, but fail fast for SKU collisions.
          const target = (e.meta as any)?.target as string[] | undefined;
          if (target?.includes('sku')) throw new BadRequestException('SKU already exists');
          continue;
        }
        throw new BadRequestException(e?.message ?? 'Failed to create product');
      }
    }

    throw new BadRequestException('Failed to create product (unique collision)');
  }

  async list(skip = 0, take = 20, q?: string) {
    const where = q
      ? {
          OR: [
            { sku: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
            { category: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: { qrCode: true, warehouse: true, zone: true, plant: true },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async getById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { qrCode: true, warehouse: true, zone: true, plant: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    if (dto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
      if (!warehouse) throw new BadRequestException('Invalid warehouseId');
    }
    const effectiveWarehouseId = dto.warehouseId
      ? dto.warehouseId
      : (await this.prisma.product.findUnique({ where: { id }, select: { warehouseId: true } }))?.warehouseId;

    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({ where: { id: dto.zoneId } });
      if (!zone) throw new BadRequestException('Invalid zoneId');
      if (effectiveWarehouseId && zone.warehouseId !== effectiveWarehouseId)
        throw new BadRequestException('zoneId does not belong to warehouseId');
    }

    if (dto.plantId) {
      const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
      if (!plant) throw new BadRequestException('Invalid plantId');
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data: dto,
        include: { qrCode: true, warehouse: true, zone: true, plant: true },
      });
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Failed to update product');
    }
  }

  async getByQrValue(value: string) {
    const qr = await this.prisma.qrCode.findUnique({
      where: { value },
      include: {
        product: { include: { qrCode: true, warehouse: true, zone: true, plant: true } },
      },
    });
    if (!qr) throw new NotFoundException('QR code not found');
    return qr.product;
  }

  async timeline(productId: string, skip = 0, take = 50) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const [movements, scans] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.scanEvent.findMany({
        where: { productId },
        orderBy: { scannedAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return { productId, movements, scans, skip, take };
  }
}
