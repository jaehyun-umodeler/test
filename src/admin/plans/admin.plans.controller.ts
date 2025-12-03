import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminAuthorities } from '@/auth/decorators/admin-authority.decorator';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt.guard';
import { ResponseDto } from '@/common/dto/response.dto';
import { Plan } from '@/plans/entities/plan.entity';
import { PlansService } from '@/plans/plans.service';
import { AdminAuthority } from '@/utils/constants';

import { AdminFindPlansDto } from './dto/admin.find-plans.dto';

@UseGuards(JwtAccessAuthGuard)
@Controller('plans')
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @AdminAuthorities(AdminAuthority.VIEWER)
  async findAll(
    @Query() query: AdminFindPlansDto,
  ): Promise<ResponseDto<Plan[]>> {
    const { isActive, type } = query;
    return this.plansService.findAll(Boolean(isActive), Number(type));
  }
}
