import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BenefitsModule } from 'src/benefits/benefits.module';
import { CampaignBenefit } from 'src/benefits/entities/campaign-benefit.entity';

import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { Campaign } from './entities/campaign.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, CampaignBenefit]),
    forwardRef(() => BenefitsModule),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
