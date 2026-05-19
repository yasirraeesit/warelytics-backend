import { IsString } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  warehouseId!: string;
}

