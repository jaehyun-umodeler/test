import { AdminFindBenefitDto } from 'src/admin/benefits/dto/admin.find-benefit.dto';
import { Benefit } from 'src/benefits/entities/benefit.entity';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { CampaignType } from 'src/utils/constants';

export class AdminCampaignDto {
  id!: string;
  type!: CampaignType;
  code!: string;
  benefits!: AdminFindBenefitDto[];
  startDate!: Date;
  endDate!: Date;
  isActive!: boolean;
  createdAt!: Date;

  constructor(campaign: Campaign, benefits: AdminFindBenefitDto[]) {
    this.id = campaign.id;
    this.type = campaign.type;
    this.code = campaign.code;
    this.benefits = benefits;
    this.startDate = campaign.startDate;
    this.endDate = campaign.endDate;
    this.isActive = campaign.isActive;
    this.createdAt = campaign.createdAt;
  }
}
