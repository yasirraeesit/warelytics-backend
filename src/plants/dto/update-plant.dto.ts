import { IsOptional, IsString } from 'class-validator';

export class UpdatePlantDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

