import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminAuthorities } from '@/auth/decorators/admin-authority.decorator';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt.guard';
import { CampaignsService } from '@/campaigns/campaigns.service';
import { CreateCampaignDto } from '@/campaigns/dto/create-campaign.dto';
import { UpdateCampaignDto } from '@/campaigns/dto/update-campaign.dto';
import { Campaign } from '@/campaigns/entities/campaign.entity';
import { ListQueryDto } from '@/common/dto/list-query.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { AdminAuthority } from '@/utils/constants';

import { AdminCampaignDto } from './dto/admin.campaign.dto';

@UseGuards(JwtAccessAuthGuard)
@Controller('campaigns')
export class AdminCampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async create(@Body() createCampaignDto: CreateCampaignDto) {
    await this.campaignsService.create(createCampaignDto);
  }

  @Get()
  @AdminAuthorities(AdminAuthority.VIEWER)
  async findAll(
    @Query() query: ListQueryDto,
  ): Promise<ResponseDto<AdminCampaignDto[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return this.campaignsService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ResponseDto<Campaign>> {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ): Promise<void> {
    await this.campaignsService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async remove(@Param('id') id: string): Promise<void> {
    await this.campaignsService.remove(id);
  }
}
