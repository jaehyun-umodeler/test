// src/organization/organization.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  Post,
  Body,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { OrganizationService } from './organization.service';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { MemberListQueryDto } from './dtos/member-list-query.dto';
import { Team } from 'src/team/entities/team.entity';
import { ListQueryDto } from 'src/common/dto/list-query.dto';
import { InvitationsService } from 'src/invitations/invitations.service';
import { UserDto } from 'src/users/dtos/users.dto';
import { CreateInvitationsDto } from 'src/invitations/dto/create-invitations.dto';
import { InvitationDto } from 'src/invitations/dto/invitation.dto';
import { InvitationListQueryDto } from './dtos/invitation-list-query.dto';
import { UpdateOrganizationMembersDto } from './dtos/update-organization-members.dto';
import { LicenseManagementStatus, OrganizationRole } from 'src/utils/constants';
import { Organization } from 'src/organization/entities/organization.entity';
import { AdminAuthorities } from 'src/auth/decorators/admin-authority.decorator';
import { AdminAuthority } from 'src/utils/constants';
import { CreateOrganizationDto } from './dtos/create-organization.dto';
import { OrganizationRoles } from 'src/auth/decorators/organization-role.decorator';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { SubscriptionNew } from 'src/subscriptions/entities/subscriptions.entity';
import { ResponseDto } from 'src/common/dto/response.dto';
import { UpdateOrganizationSubscriptionDto } from './dtos/update-organization-subscription.dto';

@Controller('organization')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly invitationsService: InvitationsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /* @Get(':id')
  async getOrganizationById(@Param('id') id: number) {
    return this.organizationService.getOrganizationById(id);
  } */

  /* @Patch(':id')
  async updateOrganization(@Param('id') id: number, @Body('name') name: string) {
    return this.organizationService.updateOrganization(id, name);
  } */

  /* @Delete(':id')
  async deleteOrganization(@Param('id') id: number) {
    return this.organizationService.deleteOrganization(id);
  } */

  // @Get('user/:userId')
  // @UseGuards(JwtAccessAuthGuard)
  // async getOrganizationByUser(
  //   @ReqPayload() payload: Payload,
  //   @Param('userId', ParseIntPipe) userId: number,
  // ): Promise<Organization> {
  //   return await this.organizationService.getOrganizationByUser(userId);
  // }

  @Get(':organizationId/members')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.USER)
  async getOrganizationMembers(
    @Req() req: Request,
    @Query() query: MemberListQueryDto,
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ): Promise<{ members: UserDto[]; totalCount: number }> {
    const accessPayload = req.accessPayload;
    const userId = accessPayload.sub;
    return this.organizationService.getOrganizationMembers(
      userId,
      organizationId,
      query.page,
      query.limit,
      query.keyword,
      query.teamId,
    );
  }

  @Post(':organizationId/members')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.MANAGER)
  async createOrganizationMembers(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() body: { emails: string[] },
  ): Promise<{ members: UserDto[]; totalCount: number }> {
    return this.organizationService.createOrganizationMembers(
      organizationId,
      body.emails,
    );
  }

  @Patch(':organizationId/members')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.MANAGER)
  async updateOrganizationMembers(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() body: UpdateOrganizationMembersDto,
  ): Promise<{ success: boolean }> {
    let teamId = body.teamId === -1 ? null : body.teamId;
    let organizationRole =
      body.organizationRole === -1 ? null : body.organizationRole;
    let licenseManagement =
      body.licenseManagement === -1 ? null : body.licenseManagement;
    const isRemove = body.isRemove;

    if (isRemove) {
      licenseManagement = LicenseManagementStatus.REVOKE;
      organizationRole = null;
      teamId = null;
    }
    await this.organizationService.updateOrganizationMembers(
      organizationId,
      body.userIds,
      licenseManagement,
      teamId,
      organizationRole,
      isRemove,
    );
    return { success: true };
  }

  @Post(':organizationId/invitations')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.MANAGER)
  async createOrganizationInvitations(
    @Req() req: Request,
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() body: CreateInvitationsDto,
  ): Promise<{ members: { email: string; errorCode?: number }[] }> {
    const accessPayload = req.accessPayload;
    const userId = accessPayload.sub;
    let teamId = body.teamId === -1 ? null : body.teamId;
    let organizationRole =
      body.organizationRole === -1 ? null : body.organizationRole;
    const validateResult =
      await this.organizationService.validateOrganizationInvitations(
        organizationId,
        body.emails,
      );
    const members = validateResult.members.filter((member) => {
      return member.errorCode !== undefined;
    });
    if (members.length > 0) {
      return { members: members };
    }
    const invitedMembers = await this.invitationsService.createInvitations(
      userId,
      organizationId,
      body.emails,
      body.invitationType,
      organizationRole,
      teamId,
    );
    return { members: invitedMembers };
  }

  @Get(':organizationId/invitations')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.USER)
  async getOrganizationInvitations(
    @Query() query: InvitationListQueryDto,
    @Param('organizationId') organizationId: number,
  ): Promise<{ invitations: InvitationDto[]; totalCount: number }> {
    return this.organizationService.getOrganizationInvitations(
      organizationId,
      query.page,
      query.limit,
      query.keyword,
      query.status,
      query.teamId,
    );
  }

  @Patch(':organizationId/invitations')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.MANAGER)
  async updateOrganizationInvitations(
    @Param('organizationId') organizationId: number,
    @Body() body: any,
  ): Promise<{ success: boolean }> {
    let teamId = body.teamId === -1 ? null : body.teamId;
    let organizationRole =
      body.organizationRole === -1 ? null : body.organizationRole;
    let status = body.status === -1 ? null : body.status;
    const isRemove = body.isRemove;

    if (isRemove) {
      organizationRole = null;
      teamId = null;
    }
    await this.organizationService.updateOrganizationInvitations(
      organizationId,
      body.invitationIds,
      status,
      teamId,
      organizationRole,
      isRemove,
    );
    return { success: true };
  }

  @Get(':organizationId/teams')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.USER)
  async getOrganizationTeams(
    @Query() query: ListQueryDto,
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ): Promise<{ teams: Team[]; totalCount: number }> {
    return this.organizationService.getOrganizationTeams(
      organizationId,
      query.page,
      query.limit,
      query.keyword,
    );
  }

  @Post(':organizationId/teams')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.MANAGER)
  async createOrganizationTeam(
    @Req() req: Request,
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body('name') name: string,
  ): Promise<Team> {
    const accessPayload = req.accessPayload;
    const userId = accessPayload.sub;
    return this.organizationService.createOrganizationTeam(
      userId,
      organizationId,
      name,
    );
  }

  @Patch(':organizationId/teams/:teamId')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.MANAGER)
  async updateOrganizationTeam(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body('name') name: string,
  ): Promise<Team> {
    return this.organizationService.updateOrganizationTeam(
      organizationId,
      teamId,
      name,
    );
  }

  @Delete(':organizationId/teams/:teamId')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.OWNER)
  async deleteOrganizationTeam(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ): Promise<void> {
    return this.organizationService.deleteOrganizationTeam(
      organizationId,
      teamId,
    );
  }

  @Get(':organizationId/subscription')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.USER)
  async getOrganizationSubscription(
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ): Promise<ResponseDto<SubscriptionNew>> {
    const subscription =
      await this.subscriptionsService.getSubscriptionByOrganizationId(
        organizationId,
      );
    return new ResponseDto<SubscriptionNew>(subscription);
  }

  @Patch(':organizationId/subscriptions/:subscriptionId')
  @UseGuards(JwtAccessAuthGuard)
  @OrganizationRoles(OrganizationRole.MANAGER)
  async updateOrganizationSubscription(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() body: UpdateOrganizationSubscriptionDto,
  ): Promise<void> {
    await this.subscriptionsService.updateSubscriptionByOrganizationId(
      organizationId,
      subscriptionId,
      null,
      body.status,
    );
  }
}
