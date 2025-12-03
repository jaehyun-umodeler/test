import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class AdminFindResourceFilesDto {
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;
}
