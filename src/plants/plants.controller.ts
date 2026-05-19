import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { PlantsService } from './plants.service';

@ApiTags('plants')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('plants')
export class PlantsController {
  constructor(private readonly plants: PlantsService) {}

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() dto: CreatePlantDto) {
    return this.plants.create(dto);
  }

  @Get()
  list(@Query('skip') skip?: string, @Query('take') take?: string, @Query('q') q?: string) {
    return this.plants.list(Number(skip ?? 0), Number(take ?? 20), q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.plants.getById(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlantDto) {
    return this.plants.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plants.remove(id);
  }
}

