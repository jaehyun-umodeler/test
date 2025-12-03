import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { EntityManager, Repository } from 'typeorm';
import { ResponseDto } from 'src/common/dto/response.dto';
import { AppException } from 'src/utils/app-exception';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignBenefit } from 'src/benefits/entities/campaign-benefit.entity';
import { BenefitsService } from 'src/benefits/benefits.service';
import { AdminCampaignDto } from 'src/admin/campaigns/dto/admin.campaign.dto';
import { AdminFindBenefitDto } from 'src/admin/benefits/dto/admin.find-benefit.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignBenefit)
    private campaignBenefitRepository: Repository<CampaignBenefit>,
    private entityManager: EntityManager,
    private benefitsService: BenefitsService,
  ) {}

  async create(createCampaignDto: CreateCampaignDto): Promise<void> {
    await this.entityManager.transaction(async (entityManager) => {
      const campaignExists = await entityManager.exists(Campaign, {
        where: {
          code: createCampaignDto.code,
        },
      });
      if (campaignExists) {
        throw AppException.campaignAlreadyExists();
      }
      const campaign = await entityManager
        .insert(
          Campaign,
          entityManager.create(Campaign, {
            type: createCampaignDto.type,
            code: createCampaignDto.code,
            startDate: createCampaignDto.startDate,
            endDate: createCampaignDto.endDate,
            isActive: true,
          }),
        )
        .then((result) => result.identifiers[0].id);
      const campaignBenefits = createCampaignDto.benefitIds.map((benefitId) =>
        entityManager.create(CampaignBenefit, {
          campaignId: campaign,
          benefitId: benefitId,
        }),
      );
      await entityManager.insert(CampaignBenefit, campaignBenefits);
    });
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<ResponseDto<AdminCampaignDto[]>> {
    const [campaigns, totalCount] = await this.campaignRepository.findAndCount({
      relations: ['campaignBenefits', 'campaignBenefits.benefit'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const adminCampaigns: AdminCampaignDto[] = [];
    for (const campaign of campaigns) {
      const benefits: AdminFindBenefitDto[] = [];
      for (const campaignBenefit of campaign.campaignBenefits) {
        if (campaignBenefit.benefit) {
          const benefitDataDto = await this.benefitsService.parseBenefitData(
            campaignBenefit.benefit,
          );
          benefits.push(
            new AdminFindBenefitDto(campaignBenefit.benefit, benefitDataDto),
          );
        }
      }
      adminCampaigns.push(new AdminCampaignDto(campaign, benefits));
    }
    return new ResponseDto(adminCampaigns, totalCount);
  }

  async findOne(id: string): Promise<ResponseDto<Campaign>> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    if (!campaign) {
      throw AppException.campaignNotFound();
    }
    return new ResponseDto<Campaign>(campaign, 1);
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
  ): Promise<void> {
    await this.entityManager.transaction(async (entityManager) => {
      const campaign = await entityManager.findOne(Campaign, { where: { id } });
      if (!campaign) {
        throw AppException.campaignNotFound();
      }
      const benefitIds = updateCampaignDto.benefitIds;
      delete updateCampaignDto.benefitIds;
      Object.assign(campaign, updateCampaignDto);
      await entityManager.update(Campaign, id, campaign);
      if (benefitIds) {
        await entityManager.delete(CampaignBenefit, { campaignId: id });
        const campaignBenefits = benefitIds.map((benefitId) =>
          entityManager.create(CampaignBenefit, {
            campaignId: id,
            benefitId: benefitId,
          }),
        );
        await entityManager.insert(CampaignBenefit, campaignBenefits);
      }
    });
  }

  async remove(id: string): Promise<void> {
    await this.campaignRepository.softDelete(id);
  }

  async receive(code: string, userId: number): Promise<void> {
    const campaign = await this.campaignRepository.findOne({
      where: {
        code: code,
        isActive: true,
      },
      relations: ['campaignBenefits', 'campaignBenefits.benefit'],
    });
    if (!campaign) {
      throw AppException.campaignNotFound();
    }
    const now = new Date();
    if (campaign.startDate > now || campaign.endDate < now) {
      throw AppException.campaignNotInDateRange();
    }
    await this.entityManager.transaction(async (entityManager) => {
      for (const campaignBenefit of campaign.campaignBenefits) {
        await this.benefitsService.receive(
          entityManager,
          campaignBenefit.benefitId,
          userId,
        );
      }
    });
  }
}
