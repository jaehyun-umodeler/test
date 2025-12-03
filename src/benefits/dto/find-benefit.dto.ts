import { BenefitType } from 'src/utils/constants';
import { Benefit } from '../entities/benefit.entity';
import { UserBenefit } from '../entities/user-benefit.entity';
import { BenefitDataDto } from './benefit-data.dto';

export class FindBenefitDto {
  constructor(
    benefit: Benefit,
    userBenefit: UserBenefit,
    data: BenefitDataDto,
  ) {
    this.id = benefit.id;
    this.type = benefit.type;
    this.data = data;
    this.startDate = benefit.startDate;
    this.endDate = benefit.endDate;
    this.isUsed = userBenefit.isUsed;
    let campaignCode = '';
    for (const campaignBenefit of benefit.campaignBenefits) {
      if (campaignBenefit.campaign) {
        campaignCode += campaignBenefit.campaign.code + ', ';
      }
    }
    this.campaignCode = campaignCode.slice(0, -2);
    this.createdAt = userBenefit.createdAt;
  }

  id: string;
  type: BenefitType;
  data: BenefitDataDto;
  startDate: Date;
  endDate: Date;
  isUsed: boolean;
  campaignCode: string;
  createdAt: Date;
}
