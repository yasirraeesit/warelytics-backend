import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZonesService } from './zones.service';

@ApiTags('zones')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('zones')
export class ZonesController {
  constructor(private readonly zones: ZonesService) {}

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() dto: CreateZoneDto) {
    return this.zones.create(dto);
  }

  @Get()
  list(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('q') q?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.zones.list(Number(skip ?? 0), Number(take ?? 20), q, warehouseId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.zones.getById(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.zones.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zones.remove(id);
  }
}

