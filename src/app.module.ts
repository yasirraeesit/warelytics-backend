import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { QrCodesModule } from './qr-codes/qr-codes.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { ZonesModule } from './zones/zones.module';
import { PlantsModule } from './plants/plants.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    QrCodesModule,
    WarehousesModule,
    ZonesModule,
    PlantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
