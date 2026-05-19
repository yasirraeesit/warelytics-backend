import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

@Injectable()
export class PlantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlantDto) {
    try {
      return await this.prisma.plant.create({ data: dto });
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Failed to create plant');
    }
  }

  async list(skip = 0, take = 20, q?: string) {
    const where: Prisma.PlantWhereInput | undefined = q
      ? {
          OR: [
            { code: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      this.prisma.plant.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plant.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async getById(id: string) {
    const plant = await this.prisma.plant.findUnique({ where: { id } });
    if (!plant) throw new NotFoundException('Plant not found');
    return plant;
  }

  async update(id: string, dto: UpdatePlantDto) {
    try {
      return await this.prisma.plant.update({ where: { id }, data: dto });
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Failed to update plant');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.plant.delete({ where: { id } });
      return { id, deleted: true };
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Failed to delete plant');
    }
  }
}

