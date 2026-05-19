import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateZoneDto) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
    if (!warehouse) throw new BadRequestException('Invalid warehouseId');

    try {
      return await this.prisma.zone.create({ data: dto });
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Failed to create zone');
    }
  }

  async list(skip = 0, take = 20, q?: string, warehouseId?: string) {
    const where: Prisma.ZoneWhereInput = {
      ...(warehouseId ? { warehouseId } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.zone.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: { warehouse: true },
      }),
      this.prisma.zone.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async getById(id: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id }, include: { warehouse: true } });
    if (!zone) throw new NotFoundException('Zone not found');
    return zone;
  }

  async update(id: string, dto: UpdateZoneDto) {
    if (dto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
      if (!warehouse) throw new BadRequestException('Invalid warehouseId');
    }

    try {
      return await this.prisma.zone.update({ where: { id }, data: dto });
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Failed to update zone');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.zone.delete({ where: { id } });
      return { id, deleted: true };
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Failed to delete zone');
    }
  }
}

