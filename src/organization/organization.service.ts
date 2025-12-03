// src/organization/organization.service.ts
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Like, Not, Repository } from 'typeorm';

import { ResponseDto } from 'src/common/dto/response.dto';
import { InvitationDto } from 'src/invitations/dto/invitation.dto';
import { Invitation } from 'src/invitations/entities/invitation.entity';
import { InvitationsService } from 'src/invitations/invitations.service';
import { LicenseGroup } from 'src/licenses/entities/license-group.entity';
import { License } from 'src/licenses/entities/license.entity';
import { LicenseService } from 'src/licenses/licenses.service';
import { OrganizationLicenseGroup } from 'src/organization/entities/organization-license-group.entity';
import { Organization } from 'src/organization/entities/organization.entity';
import { UserOrganization } from 'src/organization/entities/user-organization.entity';
import { Plan } from 'src/plans/entities/plan.entity';
import { SubscriptionNew } from 'src/subscriptions/entities/subscriptions.entity';
import { Team } from 'src/team/entities/team.entity';
import { UserTeam } from 'src/team/entities/user-team.entity';
import { TeamService } from 'src/team/team.service';
import { UserDto } from 'src/users/dtos/users.dto';
import { User } from 'src/users/entities/user.entity';
import { AppException } from 'src/utils/app-exception';
import {
  InvitationStatus,
  InvitationType,
  LicenseCategory,
  LicenseManagementStatus,
  OrganizationRole,
  OwnerType,
  SubscriptionStatus,
} from 'src/utils/constants';
import { ErrorCode } from 'src/utils/error-codes';
import { decryptEmail, encryptEmail, validateEmail } from 'src/utils/util';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserOrganization)
    private readonly userOrganizationRepository: Repository<UserOrganization>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    @Inject(forwardRef(() => LicenseService))
    private readonly licensesService: LicenseService,
    private readonly invitationsService: InvitationsService,
    private readonly teamService: TeamService,
  ) {}

  async createOrganization(
    userId: number,
    name: string,
    email: string,
    planId: string,
    totalPrice?: number,
    seatQuantity?: number,
  ): Promise<Organization> {
    // Organization, LicenseGroup 생성 및 연결
    const organization = await this.entityManager.transaction(
      async (entityManager) => {
        // 조직 이름 중복 체크
        const organizationExists = await entityManager.exists(Organization, {
          where: { name },
        });
        if (organizationExists) {
          throw AppException.organizationAlreadyExists(name);
        }

        // Organization 생성
        const organization = entityManager.create(Organization, { name });
        await entityManager.save(Organization, organization);

        // Subscription 생성
        const plan = await entityManager.findOne(Plan, {
          where: { id: planId },
        });
        const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const subscription = entityManager.create(SubscriptionNew, {
          organization: {
            id: organization.id,
          },
          plan: {
            id: planId,
          },
          totalPrice: totalPrice || plan.basePrice,
          ownerType: OwnerType.ORGANIZATION,
          seatQuantity: seatQuantity || 0,
          startDate: new Date(),
          endDate: endDate,
          nextBillingDate: endDate,
          status: SubscriptionStatus.ACTIVE,
        });
        await entityManager.save(SubscriptionNew, subscription);

        // LicenseGroup 생성
        const groupId = await this.generateUniqueGroupId(entityManager);
        const licenseGroup = entityManager.create(LicenseGroup, {
          groupOwner: [],
          groupId,
          licenseCategory: LicenseCategory.ENT,
          etc: name,
          paystatus: 0,
          price: 0,
          expiredAt: subscription.endDate,
        });
        await entityManager.save(LicenseGroup, licenseGroup);

        // OrganizationLicenseGroup 연결
        const organizationLicenseGroup = entityManager.create(
          OrganizationLicenseGroup,
          {
            organizationId: organization.id,
            licenseGroupId: licenseGroup.id,
          },
        );
        await entityManager.save(
          OrganizationLicenseGroup,
          organizationLicenseGroup,
        );

        return organization;
      },
    );

    // 초대 이메일 발송
    this.invitationsService.createInvitations(
      userId,
      organization.id,
      [email],
      InvitationType.ORGANIZATION_LICENSE,
      OrganizationRole.OWNER,
      null,
    );

    return organization;
  }

  /**
   * 고유한 LicenseGroup ID 생성
   */
  private async generateUniqueGroupId(manager: EntityManager): Promise<string> {
    let groupId: string;
    let existing = null;
    let randCnt = 4;
    let tryCount = 0;

    do {
      const randomStr = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
      const rand = randomStr.padEnd(randCnt, 'X').substring(0, randCnt);
      const date = new Date();
      groupId = `UMX-ENT-0-${rand}-${date.getFullYear().toString().slice(-2)}`;

      existing = await manager.findOne(LicenseGroup, {
        where: { groupId },
      });

      if (randCnt === 6) existing = null;

      if (tryCount > 10) {
        randCnt++;
        tryCount = 0;
      }

      tryCount++;
    } while (existing);

    return groupId;
  }

  async getAllOrganizations(
    page: number,
    limit: number,
    keyword: string,
  ): Promise<ResponseDto<Organization[]>> {
    const where = {};
    if (keyword !== null) {
      where['name'] = Like(`%${keyword}%`);
    }
    const [organizations, totalCount] =
      await this.organizationRepository.findAndCount({
        where,
        relations: ['teams'],
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    return new ResponseDto(organizations, totalCount);
  }

  /**
   * 사용자가 속한 조직 목록 조회
   * @param userId 사용자 ID
   * @returns 사용자가 속한 조직 목록
   */
  async getOrganizationsByUser(userId: number): Promise<Organization[]> {
    const userOrganizations = await this.userOrganizationRepository.find({
      where: { user: { id: userId } },
      relations: ['organization', 'organization.teams'],
    });

    const organizations = userOrganizations.map(
      (userOrg) => userOrg.organization,
    );

    return organizations;
  }

  async getOrganizationById(id: number): Promise<Organization> {
    const org = await this.organizationRepository.findOne({
      where: { id },
      relations: ['teams'],
    });
    if (!org) {
      throw AppException.organizationNotFound();
    }
    return org;
  }

  /**
   * 사용자 조직 조회
   * @param userId 사용자 ID
   * @param organizationId 조직 ID
   * @returns 사용자 조직
   */
  async getUserOrganization(
    userId: number,
    organizationId: number,
  ): Promise<UserOrganization> {
    return await this.userOrganizationRepository.findOne({
      where: { userId, organizationId },
    });
  }

  async updateOrganization(id: number, newName: string): Promise<Organization> {
    const org = await this.getOrganizationById(id);
    org.name = newName;
    return this.organizationRepository.save(org);
  }

  async deleteOrganization(id: number): Promise<void> {
    const org = await this.getOrganizationById(id);
    await this.organizationRepository.remove(org);
  }

  async getOrganizationMembers(
    userId: number,
    organizationId: number,
    page: number = 1,
    limit: number = 10,
    keyword?: string,
    teamId?: number,
  ): Promise<{ members: UserDto[]; totalCount: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userTeams', 'userTeams')
      .leftJoinAndSelect('userTeams.team', 'team')
      .leftJoinAndSelect('user.userOrganizations', 'userOrganizations')
      .leftJoinAndSelect('user.licenses', 'licenses')
      .leftJoinAndSelect('licenses.licenseGroup', 'licenseGroup')
      .leftJoinAndSelect(
        'licenseGroup.organizationLicenseGroups',
        'organizationLicenseGroups',
      )
      .where('userOrganizations.organizationId = :organizationId', {
        organizationId,
      });
    if (teamId) {
      queryBuilder.andWhere('userTeams.teamId = :teamId', { teamId });
    }
    if (keyword) {
      queryBuilder.andWhere(
        '(user.encrypted_email = :email OR user.fullname LIKE :fullname)',
        { email: encryptEmail(keyword), fullname: `%${keyword}%` },
      );
    }
    const [members, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    return {
      members: members.map((user): UserDto => {
        const license = user.licenses.find((license) =>
          license.licenseGroup.organizationLicenseGroups.some(
            (organizationLicenseGroup) =>
              organizationLicenseGroup.organizationId === organizationId &&
              license.revokedAt === null,
          ),
        );
        const userTeam = user.userTeams.find(
          (userTeam) => userTeam.organizationId === organizationId,
        );
        const { password, email, ...restUser } = user;
        const userOrganization = user.userOrganizations.find(
          (userOrganization) =>
            userOrganization.organizationId === organizationId,
        );
        return new UserDto(
          { ...restUser, email: decryptEmail(email) },
          userOrganization.organization,
          userOrganization.organizationRole,
          undefined,
          license,
          userTeam?.team,
        );
      }),
      totalCount: total,
    };
  }

  async createOrganizationMembers(
    organizationId: number,
    emails: string[],
  ): Promise<{ members: UserDto[]; totalCount: number }> {
    const users = await this.userRepository.find({
      where: { email: In(emails) },
    });
    const members = users.map((user): UserDto => {
      const { password, email, ...restUser } = user;
      const userOrganization = user.userOrganizations.find(
        (userOrganization) =>
          userOrganization.organizationId === organizationId,
      );
      return new UserDto(
        { ...restUser, email: decryptEmail(email) },
        userOrganization.organization,
        userOrganization.organizationRole,
      );
    });
    return { members, totalCount: members.length };
  }

  async updateOrganizationMembers(
    organizationId: number,
    userIds: number[],
    licenseManagement: number,
    teamId?: number,
    organizationRole?: OrganizationRole,
    isRemove?: boolean,
  ): Promise<void> {
    const userOrganizations = await this.userOrganizationRepository.find({
      where: { userId: In(userIds), organizationId: organizationId },
      relations: ['user', 'user.licenses', 'user.licenses.licenseGroup'],
    });
    if (userOrganizations.length !== userIds.length) {
      throw AppException.userNotFound();
    }
    await this.entityManager.transaction(async (entityManager) => {
      if (teamId !== null) {
        await entityManager.query(`
          INSERT INTO user_team (user_id, team_id, organization_id)
          VALUES
          ${userIds
            .map((userId) => `(${userId}, ${teamId}, ${organizationId})`)
            .join(',')}
          ON DUPLICATE KEY UPDATE team_id = VALUES(team_id)
        `);
      }
      if (organizationRole !== null) {
        await entityManager.update(
          UserOrganization,
          { userId: In(userIds), organizationId: organizationId },
          { organizationRole },
        );
      }
      if (licenseManagement !== null) {
        const organizationLicenseGroup = await this.entityManager.findOne(
          OrganizationLicenseGroup,
          {
            where: {
              organizationId: organizationId,
            },
            relations: ['licenseGroup'],
          },
        );
        if (!organizationLicenseGroup) {
          throw AppException.licenseNotFound();
        }
        const issueUsers: User[] = [];
        const revokeUsers: User[] = [];
        for (const userOrganization of userOrganizations) {
          const license = userOrganization.user.licenses.find(
            (license) =>
              license.licenseGroup.id ===
                organizationLicenseGroup.licenseGroup.id &&
              license.revokedAt === null,
          );
          if (!license) {
            issueUsers.push(userOrganization.user);
          } else {
            revokeUsers.push(userOrganization.user);
          }
        }
        switch (licenseManagement) {
          case LicenseManagementStatus.ISSUE:
            await this.licensesService.createOrganizationLicenses(
              entityManager,
              organizationLicenseGroup.licenseGroup,
              issueUsers,
            );
            break;
          case LicenseManagementStatus.REVOKE:
            await this.licensesService.revokeOrganizationLicenses(
              entityManager,
              organizationLicenseGroup.licenseGroup,
              revokeUsers,
            );
            break;
        }
      }
      if (isRemove) {
        await entityManager.delete(UserOrganization, {
          userId: In(userIds),
          organizationId: organizationId,
        });
        await entityManager.delete(UserTeam, {
          userId: In(userIds),
          organizationId: organizationId,
        });
      }
      await this.validateOrganization(entityManager, organizationId);
    });
  }

  async getOrganizationInvitations(
    organizationId: number,
    page: number = 1,
    limit: number = 10,
    keyword?: string,
    status?: InvitationStatus,
    teamId?: number,
  ): Promise<{ invitations: InvitationDto[]; totalCount: number }> {
    const skip = (page - 1) * limit;

    let queryBuilder = this.invitationRepository
      .createQueryBuilder('invitation')
      .leftJoinAndSelect('invitation.invitedByUser', 'invitedByUser')
      .leftJoinAndSelect('invitation.organization', 'organization')
      .leftJoinAndSelect('invitation.team', 'team')
      .where('invitation.organizationId = :organizationId', { organizationId })
      .andWhere('invitation.deletedAt IS NULL');

    if (status !== undefined) {
      queryBuilder.andWhere('invitation.status = :status', { status });
    }

    if (teamId !== undefined) {
      queryBuilder.andWhere('invitation.teamId = :teamId', { teamId });
    }

    if (keyword) {
      const isEmail = validateEmail(keyword);

      if (isEmail) {
        queryBuilder.andWhere('invitation.email = :email', {
          email: encryptEmail(keyword),
        });
      } else {
        queryBuilder.andWhere('invitedByUser.fullname LIKE :fullname', {
          fullname: `%${keyword}%`,
        });
      }
    }

    const [invitations, total] = await queryBuilder
      .orderBy('invitation.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const processedInvitations = invitations.map((invitation: any) => {
      if (invitation.email) {
        invitation.email = decryptEmail(invitation.email);
      }
      if (invitation.invitedByUser) {
        invitation.invitedByUser = { name: invitation.invitedByUser?.fullname };
      }
      return invitation;
    });

    return { invitations: processedInvitations, totalCount: total };
  }

  async updateOrganizationInvitations(
    organizationId: number,
    invitationIds: number[],
    status: InvitationStatus | null,
    teamId: number | null,
    organizationRole: OrganizationRole | null,
    isRemove: boolean,
  ): Promise<void> {
    const invitations = await this.invitationRepository.find({
      where: {
        id: In(invitationIds),
        organizationId,
        status: InvitationStatus.PENDING,
      },
    });
    if (invitations.length !== invitationIds.length) {
      throw AppException.invitationNotFound();
    }

    await this.entityManager.transaction(async (entityManager) => {
      if (teamId !== null) {
        await entityManager.update(
          Invitation,
          {
            id: In(invitationIds),
            organizationId,
          },
          { teamId },
        );
      }

      if (organizationRole !== null) {
        await entityManager.update(
          Invitation,
          {
            id: In(invitationIds),
            organizationId,
          },
          { organizationRole },
        );
      }

      if (status !== null) {
        await entityManager.update(
          Invitation,
          {
            id: In(invitationIds),
            organizationId,
          },
          { status },
        );
      }

      if (isRemove) {
        await entityManager.softDelete(Invitation, {
          id: In(invitationIds),
          organizationId,
        });
      }
    });
  }

  async validateOrganizationInvitations(
    organizationId: number,
    emails: string[],
  ): Promise<{ members: { email: string; errorCode?: number }[] }> {
    const members: { email: string; errorCode?: number }[] = [];
    for (const email of emails) {
      let isValid = validateEmail(email);
      if (!isValid) {
        members.push({ email, errorCode: ErrorCode.INVALID_EMAIL_FORMAT });
        continue;
      }
      const existInvitation = await this.invitationRepository.exists({
        where: {
          email: encryptEmail(email),
          organizationId: organizationId,
          status: InvitationStatus.PENDING,
          deletedAt: IsNull(),
        },
      });
      if (existInvitation) {
        members.push({ email, errorCode: ErrorCode.INVITATION_ALREADY_SENT });
        continue;
      }
      const existUserOrganization =
        await this.userOrganizationRepository.exists({
          where: {
            user: { email: encryptEmail(email) },
            organization: { id: organizationId },
          },
        });
      if (existUserOrganization) {
        members.push({ email, errorCode: ErrorCode.MEMBER_ALREADY_EXISTS });
        continue;
      }
      members.push({ email });
    }
    return { members: members };
  }

  async getOrganizationTeams(
    organizationId: number,
    page: number = 1,
    limit: number = 10,
    keyword?: string,
  ): Promise<{ teams: Team[]; totalCount: number }> {
    const skip = (page - 1) * limit;
    let queryBuilder = this.teamRepository
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.organization', 'organization')
      .leftJoinAndSelect('team.userTeams', 'userTeams')
      .leftJoinAndSelect('userTeams.user', 'user')
      .where('organization.id = :organizationId', { organizationId });
    if (keyword) {
      queryBuilder.andWhere('team.name LIKE :name', {
        name: `%${keyword}%`,
      });
    }
    const [teams, total] = await queryBuilder
      .orderBy('team.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    const processedTeams = teams.map((team: Team) => {
      if (team.userTeams && team.userTeams.length > 0) {
        team.userTeams = team.userTeams.map((userTeam: UserTeam) => {
          if (userTeam.user) {
            const { password, email, ...restUser } = userTeam.user;
            return {
              ...userTeam,
              user: {
                ...restUser,
                email: decryptEmail(email),
              },
            };
          }
          return userTeam;
        });
      }
      return team;
    });
    return { teams: processedTeams, totalCount: total };
  }

  async createOrganizationTeam(
    userId: number,
    organizationId: number,
    name: string,
  ): Promise<Team> {
    const organization = await this.organizationRepository.findOne({
      where: {
        id: organizationId,
        userOrganizations: { user: { id: userId } },
      },
      relations: ['teams', 'userOrganizations.user'],
    });
    if (!organization) {
      throw AppException.organizationNotFound({ organizationId });
    }
    await this.teamService.validateTeamName(name);
    const existTeam = await this.teamRepository.exists({
      where: { name, organization: { id: organizationId } },
    });
    if (existTeam) {
      throw AppException.teamAlreadyExists({ teamName: name });
    }
    const team = this.teamRepository.create({ name, organization });
    return this.teamRepository.save(team);
  }

  async updateOrganizationTeam(
    organizationId: number,
    teamId: number,
    name: string,
  ): Promise<Team> {
    await this.teamService.validateTeamName(name);
    const team = await this.teamRepository.findOne({
      where: { id: teamId, organization: { id: organizationId } },
    });
    if (!team) {
      throw AppException.teamNotFound({ teamId });
    }
    team.name = name;
    return this.teamRepository.save(team);
  }

  async deleteOrganizationTeam(
    organizationId: number,
    teamId: number,
  ): Promise<void> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId, organization: { id: organizationId } },
    });
    if (!team) {
      throw AppException.teamNotFound({ teamId });
    }
    if (team.userTeams && team.userTeams.length > 0) {
      throw AppException.memberAlreadyExists({ teamName: team.name });
    }
    await this.teamRepository.remove(team);
  }

  async validateOrganization(
    entityManager: EntityManager,
    organizationId: number,
  ) {
    const existOwner = await entityManager.exists(UserOrganization, {
      where: {
        organizationId: organizationId,
        organizationRole: OrganizationRole.OWNER,
      },
    });
    if (!existOwner) {
      throw AppException.organizationAccessDenied();
    }
  }

  /**
   * 조직의 라이센스 발행 제한 검증
   * @param entityManager 엔티티 매니저
   * @param organizationId 조직 ID
   * @param licenseGroupId 라이센스 그룹 ID
   * @param requestedCount 발행하려는 라이센스 수
   */
  async validateLicenseIssueLimit(
    entityManager: EntityManager,
    organizationId: number,
    licenseGroupId: number,
    requestedCount: number,
  ) {
    const subscription = await entityManager.findOne(SubscriptionNew, {
      where: { organization: { id: organizationId } },
      relations: ['plan'],
    });

    if (!subscription || !subscription.plan) {
      throw AppException.subscriptionNotFound();
    }

    const maxLicenses =
      subscription.plan.baseSeatQuantity + subscription.seatQuantity;
    const issuedLicenses = await entityManager.count(License, {
      where: {
        licenseGroup: {
          id: licenseGroupId,
        },
        revokedAt: IsNull(),
      },
    });
    const pendingInvitations = await entityManager.count(Invitation, {
      where: {
        organizationId: organizationId,
        invitationType: InvitationType.ORGANIZATION_LICENSE,
        status: InvitationStatus.PENDING,
        deletedAt: IsNull(),
      },
    });
    const totalIssued = issuedLicenses + pendingInvitations;
    const availableLicenses = maxLicenses - totalIssued;

    if (requestedCount > availableLicenses) {
      throw AppException.licenseIssueLimitExceeded({
        maxLicenses,
        issuedLicenses,
        pendingInvitations,
        availableLicenses,
        requestedCount,
      });
    }
  }
}
