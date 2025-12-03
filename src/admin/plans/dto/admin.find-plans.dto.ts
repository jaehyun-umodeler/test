import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class AdminFindPlansDto {
  @IsString()
  @IsOptional()
  type?: string;

  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;
}
