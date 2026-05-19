import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWarehouseDto) {
    try {
      return await this.prisma.warehouse.create({ data: dto });
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Failed to create warehouse');
    }
  }

  async list(skip = 0, take = 20, q?: string) {
    const where: Prisma.WarehouseWhereInput | undefined = q
      ? {
          OR: [
            { code: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: { zones: true },
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async getById(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: { zones: true },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    try {
      return await this.prisma.warehouse.update({ where: { id }, data: dto });
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Failed to update warehouse');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.warehouse.delete({ where: { id } });
      return { id, deleted: true };
    } catch (e: any) {
      throw new BadRequestException(
        e?.message ?? 'Failed to delete warehouse (it may be referenced by products)',
      );
    }
  }
}

