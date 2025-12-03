import { BenefitType } from 'src/utils/constants';
import { Benefit } from 'src/benefits/entities/benefit.entity';
import { BenefitDataDto } from 'src/benefits/dto/benefit-data.dto';

export class AdminFindBenefitDto {
  constructor(benefit: Benefit, data: BenefitDataDto) {
    this.id = benefit.id;
    this.type = benefit.type;
    this.data = data;
    this.startDate = benefit.startDate;
    this.endDate = benefit.endDate;
    this.createdAt = benefit.createdAt;
  }

  id: string;
  type: BenefitType;
  data: BenefitDataDto;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}
