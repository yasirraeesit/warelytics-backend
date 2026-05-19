import { IsOptional, IsString } from 'class-validator';

export class UpdateZoneDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;
}

