import {
  Controller,
  UseGuards,
  Param,
  Get,
  NotFoundException,
  Query,
  HttpCode,
  HttpStatus,
  Post,
  Delete,
} from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { AdminAuthorities } from 'src/auth/decorators/admin-authority.decorator';
import { AdminAuthority } from 'src/utils/constants';
import { decryptEmail } from 'src/utils/util';
import { AdminFindUsersDto } from './dtos/admin.find-users.dto';
import { AdminUsersService } from './admin.users.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { LicenseDto } from 'src/licenses/dtos/license.dto';
import { LicenseService } from 'src/licenses/licenses.service';
import { BenefitsService } from 'src/benefits/benefits.service';
import { CampaignsService } from 'src/campaigns/campaigns.service';

@UseGuards(JwtAccessAuthGuard)
@Controller('users')
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminUsersService: AdminUsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly licenseService: LicenseService,
    private readonly benefitsService: BenefitsService,
    private readonly campaignsService: CampaignsService,
  ) {}

  @Get()
  @AdminAuthorities(AdminAuthority.VIEWER)
  async getUsers(@Query() query: AdminFindUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const keyword = query.keyword || null;
    const validType = query.validType || null;
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;
    const subscriptionStatus = query.subscriptionStatus
      ? Number(query.subscriptionStatus)
      : null;
    const providerType = query.providerType || null;
    const planType = query.planType || null;
    return this.adminUsersService.findAll(
      page,
      limit,
      keyword,
      validType,
      startDate,
      endDate,
      subscriptionStatus,
      providerType,
      planType,
    );
  }

  @Get(':id')
  @AdminAuthorities(AdminAuthority.VIEWER)
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(Number(id));
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const decodedEmail = decryptEmail(user.email);
    return {
      id: user.id,
      joinType: user.googleId ? 'Google' : 'Email',
      email: decodedEmail,
      joinDate: user.createdAt,
      name: user.fullname,
      isAcceptMarketingActivities: user.isAcceptMarketingActivities,
      paymentCards: [],
      country: user.countryCode,
      language: user.language,
    };
  }

  @Get('search-admin/:email')
  @AdminAuthorities(AdminAuthority.VIEWER)
  async searchUserFromAdmin(@Param('email') email: string) {
    return this.usersService.searchInner(email, { validType: 'valid' });
  }

  @Get(':id/licenses')
  @AdminAuthorities(AdminAuthority.VIEWER)
  async getUserLicenses(@Param('id') id: number): Promise<LicenseDto[]> {
    const res = await this.licenseService.getLicensesByUser(id);
    return res;
  }

  @Get(':id/subscriptions')
  @AdminAuthorities(AdminAuthority.VIEWER)
  async getUserSubscriptions(@Param('id') id: number) {
    return this.subscriptionsService.getSubscriptionsByUserId(id);
  }

  @Get(':id/benefits')
  @AdminAuthorities(AdminAuthority.VIEWER)
  async getUserBenefits(@Param('id') id: number) {
    return this.benefitsService.findAllByUserId(id);
  }

  @Delete(':id/benefits/:benefitId')
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserBenefit(
    @Param('id') id: number,
    @Param('benefitId') benefitId: string,
  ): Promise<void> {
    await this.benefitsService.removeUserBenefit(id, benefitId);
  }

  @Post(':id/campaigns/:code/apply')
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async applyCampaignToUser(
    @Param('id') id: number,
    @Param('code') code: string,
  ): Promise<void> {
    await this.campaignsService.receive(code, id);
  }
}
