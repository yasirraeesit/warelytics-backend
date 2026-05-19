import { IsString } from 'class-validator';

export class CreatePlantDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;
}

