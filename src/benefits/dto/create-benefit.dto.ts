import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { BenefitType, LicenseCategory } from 'src/utils/constants';

export class CreateBenefitDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsEnum(BenefitType)
  @IsNotEmpty()
  type!: BenefitType;

  @IsNumber()
  @IsOptional()
  resourceFileId?: number;

  @IsNumber()
  @IsOptional()
  days?: number;

  @IsNumber()
  @IsOptional()
  licenseCategory?: LicenseCategory;

  @Type(() => Date)
  @IsNotEmpty()
  startDate!: Date;

  @Type(() => Date)
  @IsNotEmpty()
  endDate!: Date;
}
