import {
  Controller,
  UseGuards,
  Body,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Req,
  Query,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { AdminAuthorities } from 'src/auth/decorators/admin-authority.decorator';
import { AdminAuthority } from 'src/utils/constants';
import { OrganizationService } from 'src/organization/organization.service';
import { Organization } from 'src/organization/entities/organization.entity';
import { CreateOrganizationDto } from 'src/organization/dtos/create-organization.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { ListQueryDto } from 'src/common/dto/list-query.dto';

@UseGuards(JwtAccessAuthGuard)
@Controller('organizations')
export class AdminOrganizationsController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * 조직 목록 조회
   */
  @Get()
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.OK)
  async getOrganizations(
    @Query() query: ListQueryDto,
  ): Promise<ResponseDto<Organization[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const keyword = query.keyword || null;
    return this.organizationService.getAllOrganizations(page, limit, keyword);
  }

  /**
   * 조직 생성
   * @param body 조직 생성 요청 DTO
   */
  @Post()
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.CREATED)
  async createOrganization(
    @Req() req: Request,
    @Body() body: CreateOrganizationDto,
  ) {
    const accessPayload = req.accessPayload;
    await this.organizationService.createOrganization(
      accessPayload.sub,
      body.name,
      body.email,
      body.planId,
      body.totalPrice,
      body.seatQuantity,
    );
  }
}
