import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateTutorialFileDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsNumber()
  @IsOptional()
  sequence?: number;
}
