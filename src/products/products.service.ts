import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import crypto from 'crypto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function generateQrValue() {
  return `QR_${crypto.randomBytes(16).toString('hex')}`;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
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
      // Prisma unique constraint / FK errors
      throw new BadRequestException(e?.message ?? 'Failed to create product');
    }
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

