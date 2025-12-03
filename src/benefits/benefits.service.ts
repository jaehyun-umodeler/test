import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual, Repository } from 'typeorm';
import { Benefit } from './entities/benefit.entity';
import { ResponseDto } from 'src/common/dto/response.dto';
import { AppException } from 'src/utils/app-exception';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';
import { ResourceFilesService } from 'src/resource-files/resource-files.service';
import { FindBenefitDto } from './dto/find-benefit.dto';
import { UserBenefit } from './entities/user-benefit.entity';
import { BenefitDataDto } from './dto/benefit-data.dto';
import { AdminFindBenefitDto } from 'src/admin/benefits/dto/admin.find-benefit.dto';
import { ResourceFile } from 'src/resource-files/entities/resource-file.entity';
import { BenefitType } from 'src/utils/constants';
import { LicenseService } from 'src/licenses/licenses.service';

@Injectable()
export class BenefitsService {
  constructor(
    @InjectRepository(Benefit)
    private benefitRepository: Repository<Benefit>,
    private resourceFilesService: ResourceFilesService,
    @InjectRepository(UserBenefit)
    private userBenefitRepository: Repository<UserBenefit>,
    @InjectEntityManager()
    private entityManager: EntityManager,
    @Inject(forwardRef(() => LicenseService))
    private licenseService: LicenseService,
  ) {}

  async create(createBenefitDto: CreateBenefitDto): Promise<void> {
    const data = {};
    if (createBenefitDto.resourceFileId !== undefined) {
      data['resourceFileId'] = createBenefitDto.resourceFileId;
    }
    if (createBenefitDto.days !== undefined) {
      data['days'] = createBenefitDto.days;
    }
    if (createBenefitDto.licenseCategory !== undefined) {
      data['licenseCategory'] = createBenefitDto.licenseCategory;
    }
    await this.benefitRepository.save(
      this.benefitRepository.create({
        title: createBenefitDto.title,
        type: createBenefitDto.type,
        data: JSON.stringify(data),
        startDate: createBenefitDto.startDate,
        endDate: createBenefitDto.endDate,
      }),
    );
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<ResponseDto<AdminFindBenefitDto[]>> {
    const [benefits, totalCount] = await this.benefitRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const adminFindBenefitDtos: AdminFindBenefitDto[] = [];
    for (const benefit of benefits) {
      const benefitDataDto = await this.parseBenefitData(benefit);
      adminFindBenefitDtos.push(
        new AdminFindBenefitDto(benefit, benefitDataDto),
      );
    }
    return new ResponseDto<AdminFindBenefitDto[]>(
      adminFindBenefitDtos,
      totalCount,
    );
  }

  async findAllByUserId(
    userId: number,
  ): Promise<ResponseDto<FindBenefitDto[]>> {
    const [benefits, totalCount] = await this.benefitRepository.findAndCount({
      where: {
        userBenefits: {
          userId: userId,
        },
        endDate: MoreThanOrEqual(new Date()),
      },
      relations: [
        'userBenefits',
        'campaignBenefits',
        'campaignBenefits.campaign',
      ],
      order: { createdAt: 'DESC' },
    });
    const findBenefitDtos: FindBenefitDto[] = [];
    for (const benefit of benefits) {
      const benefitDataDto = await this.parseBenefitData(benefit);
      findBenefitDtos.push(
        new FindBenefitDto(
          benefit,
          benefit.userBenefits.find(
            (userBenefit) => userBenefit.userId === userId,
          ),
          benefitDataDto,
        ),
      );
    }
    return new ResponseDto<FindBenefitDto[]>(findBenefitDtos, totalCount);
  }

  async findOne(id: string): Promise<ResponseDto<Benefit>> {
    const benefit = await this.benefitRepository.findOne({ where: { id } });
    if (!benefit) {
      throw AppException.benefitNotFound();
    }
    return new ResponseDto<Benefit>(benefit, 1);
  }

  async update(id: string, updateBenefitDto: UpdateBenefitDto): Promise<void> {
    const benefit = await this.benefitRepository.findOne({ where: { id } });
    if (!benefit) {
      throw AppException.benefitNotFound();
    }
    const data = {};
    if (updateBenefitDto.resourceFileId !== undefined) {
      data['resourceFileId'] = updateBenefitDto.resourceFileId;
    }
    if (updateBenefitDto.days !== undefined) {
      data['days'] = updateBenefitDto.days;
    }
    if (updateBenefitDto.licenseCategory !== undefined) {
      data['licenseCategory'] = updateBenefitDto.licenseCategory;
    }
    benefit.data = JSON.stringify(data);
    Object.assign(benefit, updateBenefitDto);
    await this.benefitRepository.save(benefit);
  }

  async remove(id: string): Promise<void> {
    const benefit = await this.benefitRepository.findOne({ where: { id } });
    if (!benefit) {
      throw AppException.benefitNotFound();
    }
    await this.benefitRepository.softDelete(id);
  }

  async removeUserBenefit(userId: number, benefitId: string): Promise<void> {
    const userBenefit = await this.userBenefitRepository.findOne({
      where: { userId: userId, benefitId: benefitId },
    });
    if (!userBenefit) {
      throw AppException.benefitNotFound();
    }
    await this.userBenefitRepository.delete(userBenefit.id);
  }

  async receive(
    entityManager: EntityManager,
    benefitId: string,
    userId: number,
  ): Promise<void> {
    const benefit = await entityManager.findOne(Benefit, {
      where: { id: benefitId },
    });
    if (!benefit) {
      throw AppException.benefitNotFound();
    }
    const userBenefitExists = await entityManager.exists(UserBenefit, {
      where: { benefitId: benefitId, userId: userId },
    });
    if (userBenefitExists) {
      throw AppException.benefitAlreadyReceived();
    }
    const userBenefit = entityManager.create(UserBenefit, {
      benefitId: benefitId,
      userId: userId,
    });
    await entityManager.insert(UserBenefit, userBenefit);
  }

  async getDownloadUrl(userId: number, benefitId: string): Promise<string> {
    const userBenefit = await this.userBenefitRepository.findOne({
      where: { userId: userId, benefitId: benefitId },
      relations: ['benefit'],
    });
    if (!userBenefit) {
      throw AppException.benefitNotFound();
    }
    const now = new Date();
    if (
      userBenefit.benefit.startDate > now ||
      userBenefit.benefit.endDate < now
    ) {
      throw AppException.benefitNotInDateRange();
    }
    const benefitDataDto = await this.parseBenefitData(userBenefit.benefit);
    if (!benefitDataDto.resourceFileId) {
      throw AppException.benefitNotFound();
    }
    const response = await this.resourceFilesService.findOne(
      benefitDataDto.resourceFileId,
    );
    if (!response.data) {
      throw AppException.notFound('Resource file not found');
    }
    if (!userBenefit.isUsed) {
      userBenefit.isUsed = true;
      await this.userBenefitRepository.save(userBenefit);
    }
    return benefitDataDto.resourceFileUrl;
  }

  async use(userId: number, benefitId: string): Promise<void> {
    await this.entityManager.transaction(async (entityManager) => {
      const userBenefit = await entityManager.findOne(UserBenefit, {
        where: { userId: userId, benefitId: benefitId },
        relations: ['benefit', 'user'],
      });
      if (!userBenefit) {
        throw AppException.benefitNotFound();
      }
      if (userBenefit.isUsed) {
        throw AppException.benefitAlreadyReceived();
      }
      const now = new Date();
      if (
        userBenefit.benefit.startDate > now ||
        userBenefit.benefit.endDate < now
      ) {
        throw AppException.benefitNotInDateRange();
      }
      switch (userBenefit.benefit.type) {
        case BenefitType.FREE_ASSET:
          return;
        case BenefitType.FREE_LICENSE:
          const benefitData = await this.parseBenefitData(userBenefit.benefit);
          await this.licenseService.createFreeLicense(
            entityManager,
            userBenefit.user,
            benefitData.licenseCategory,
            benefitData.days,
          );
          break;
        case BenefitType.LICENSE_EXTENSION:
          return;
      }
      userBenefit.isUsed = true;
      await entityManager.save(UserBenefit, userBenefit);
    });
  }

  async parseBenefitData(benefit: Benefit): Promise<BenefitDataDto> {
    const data = JSON.parse(benefit.data);
    let resourceFile: ResourceFile | undefined;
    if (data['resourceFileId']) {
      const response = await this.resourceFilesService.findOne(
        data['resourceFileId'],
      );
      if (response.data) {
        resourceFile = response.data;
        data['resourceFileUrl'] = this.getResourceFileDownloadUrl(resourceFile);
      }
    }
    return new BenefitDataDto(
      resourceFile?.title,
      resourceFile?.id,
      data['resourceFileUrl'],
      data['days'],
      data['licenseCategory'],
    );
  }

  getResourceFileDownloadUrl(resourceFile: ResourceFile): string {
    const apiUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://api.umodeler.com'
        : 'https://api-dev.umodeler.com';
    return `${apiUrl}/download/${resourceFile.path}`;
  }
}
