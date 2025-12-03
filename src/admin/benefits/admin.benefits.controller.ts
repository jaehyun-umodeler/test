import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BenefitsService } from 'src/benefits/benefits.service';
import { AdminAuthorities } from 'src/auth/decorators/admin-authority.decorator';
import { AdminAuthority } from 'src/utils/constants';
import { ResponseDto } from 'src/common/dto/response.dto';
import { Benefit } from 'src/benefits/entities/benefit.entity';
import { CreateBenefitDto } from 'src/benefits/dto/create-benefit.dto';
import { UpdateBenefitDto } from 'src/benefits/dto/update-benefit.dto';
import { AdminFindBenefitDto } from './dto/admin.find-benefit.dto';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { ListQueryDto } from 'src/common/dto/list-query.dto';

@UseGuards(JwtAccessAuthGuard)
@Controller('benefits')
export class AdminBenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async create(@Body() createBenefitDto: CreateBenefitDto): Promise<void> {
    await this.benefitsService.create(createBenefitDto);
  }

  @Get()
  @AdminAuthorities(AdminAuthority.VIEWER)
  async findAll(
    @Query() query: ListQueryDto,
  ): Promise<ResponseDto<AdminFindBenefitDto[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return this.benefitsService.findAll(page, limit);
  }

  @Get(':id')
  @AdminAuthorities(AdminAuthority.VIEWER)
  async findOne(@Param('id') id: string): Promise<ResponseDto<Benefit>> {
    return this.benefitsService.findOne(id);
  }

  @Patch(':id')
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() updateBenefitDto: UpdateBenefitDto,
  ): Promise<void> {
    await this.benefitsService.update(id, updateBenefitDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async remove(@Param('id') id: string): Promise<void> {
    await this.benefitsService.remove(id);
  }
}
