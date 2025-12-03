import { Injectable } from '@nestjs/common';
import { PlanType } from 'src/utils/constants';
import { Plan } from './entities/plan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseDto } from 'src/common/dto/response.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async findAll(
    isActive?: boolean,
    type?: PlanType,
  ): Promise<ResponseDto<Plan[]>> {
    const queryBuilder = this.planRepository.createQueryBuilder('plan');
    if (isActive !== undefined) {
      queryBuilder.where('plan.isActive = :isActive', { isActive });
    }
    if (type !== undefined) {
      queryBuilder.where('plan.type = :type', { type });
    }
    const [plans, totalCount] = await queryBuilder.getManyAndCount();
    return new ResponseDto(plans, totalCount);
  }
}
