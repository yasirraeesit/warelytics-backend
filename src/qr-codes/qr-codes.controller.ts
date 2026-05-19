import { Controller, Get, Header, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import QRCode from 'qrcode';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { QrCodesService } from './qr-codes.service';

@ApiTags('qr-codes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('qr-codes')
export class QrCodesController {
  constructor(private readonly qr: QrCodesService) {}

  @Get(':productId')
  get(@Param('productId') productId: string) {
    return this.qr.getByProductId(productId);
  }

  @Get(':productId/image')
  @Header('Content-Type', 'image/png')
  async image(@Param('productId') productId: string) {
    const code = await this.qr.getByProductId(productId);
    return QRCode.toBuffer(code.value, { type: 'png', width: 512, margin: 2 });
  }

  @Roles(Role.ADMIN)
  @Post(':productId/regenerate')
  regenerate(@Param('productId') productId: string) {
    return this.qr.regenerate(productId);
  }
}

