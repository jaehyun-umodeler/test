import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { CampaignType } from '@/utils/constants';

export class CreateCampaignDto {
  @IsEnum(CampaignType)
  @IsNotEmpty()
  type!: CampaignType;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @Type(() => Date)
  @IsNotEmpty()
  startDate!: Date;

  @Type(() => Date)
  @IsNotEmpty()
  endDate!: Date;

  @IsArray()
  @IsNotEmpty()
  benefitIds!: string[];
}
