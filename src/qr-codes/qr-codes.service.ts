import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import crypto from 'crypto';

function newQrValue() {
  return `QR_${crypto.randomBytes(16).toString('hex')}`;
}

@Injectable()
export class QrCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async getByProductId(productId: string) {
    const qr = await this.prisma.qrCode.findUnique({ where: { productId } });
    if (!qr) throw new NotFoundException('QR code not found for product');
    return qr;
  }

  async regenerate(productId: string) {
    const existing = await this.prisma.qrCode.findUnique({ where: { productId } });
    if (!existing) throw new NotFoundException('QR code not found for product');

    for (let i = 0; i < 5; i++) {
      const value = newQrValue();
      try {
        return await this.prisma.qrCode.update({
          where: { id: existing.id },
          data: { value },
        });
      } catch (e: any) {
        // unique collision; retry
      }
    }

    throw new BadRequestException('Failed to regenerate QR code (unique collision)');
  }
}

