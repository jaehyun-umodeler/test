import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { Invitation } from 'src/invitations/entities/invitation.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { InvitationType, OrganizationRole } from 'src/utils/constants';
import { InvitationStatus } from 'src/utils/constants';
import { randomUUID } from 'crypto';
import { decryptEmail, encryptEmail } from 'src/utils/util';
import { EmailService } from 'src/email/email.service';
import { AppException } from 'src/utils/app-exception';
import { UsersService } from 'src/users/users.service';
import { InvitationDto } from './dto/invitation.dto';
import { UserOrganization } from 'src/organization/entities/user-organization.entity';
import { LicenseService } from 'src/licenses/licenses.service';
import { UserTeam } from 'src/team/entities/user-team.entity';
import { OrganizationLicenseGroup } from 'src/organization/entities/organization-license-group.entity';
import { OrganizationService } from 'src/organization/organization.service';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationsRepository: Repository<Invitation>,
    private emailService: EmailService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => LicenseService))
    private licenseService: LicenseService,
    @InjectEntityManager()
    private entityManager: EntityManager,
    @Inject(forwardRef(() => OrganizationService))
    private organizationService: OrganizationService,
  ) {}

  async toInvitationDto(invitation: Invitation) {
    return new InvitationDto(invitation);
  }

  async createInvitations(
    userId: number,
    organizationId: number,
    emails: string[],
    invitationType: InvitationType,
    organizationRole: OrganizationRole,
    teamId: number,
  ): Promise<{ email: string }[]> {
    const inviter = await this.usersService.findById(userId);
    const inviterEmail = decryptEmail(inviter.email);
    const organization = await this.organizationService.getOrganizationById(
      organizationId,
    );

    if (invitationType === InvitationType.ORGANIZATION_LICENSE) {
      const organizationLicenseGroup = await this.entityManager.findOne(
        OrganizationLicenseGroup,
        {
          where: {
            organizationId: organizationId,
          },
          relations: ['licenseGroup'],
        },
      );

      if (organizationLicenseGroup) {
        await this.organizationService.validateLicenseIssueLimit(
          this.entityManager,
          organizationId,
          organizationLicenseGroup.licenseGroup.id,
          emails.length,
        );
      }
    }

    let invitations = emails.map((email) =>
      this.invitationsRepository.create({
        email: encryptEmail(email),
        organizationId,
        organizationRole,
        teamId,
        invitedByUserId: userId,
        invitationType,
        status: InvitationStatus.PENDING,
        invitationToken: randomUUID().toString(),
      }),
    );
    const insertedInvitations = await this.invitationsRepository.insert(
      invitations,
    );

    invitations = await this.invitationsRepository.find({
      where: {
        id: In(
          insertedInvitations.identifiers.map((identifier) => identifier.id),
        ),
      },
      relations: ['invitedByUser', 'organization', 'team'],
    });

    this.emailService.sendOrganizationInvitationEmail(
      inviterEmail,
      organization.name,
      invitations,
      inviter.language,
    );
    return emails.map((email) => {
      return { email };
    });
  }

  async findOneByToken(userId: number, invitationToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw AppException.userNotFound();
    }
    const invitation = await this.invitationsRepository.findOne({
      where: { invitationToken, email: user.email },
      relations: ['invitedByUser', 'organization', 'team'],
    });
    if (!invitation) {
      throw AppException.invitationNotFound();
    }
    const { email, password, ...restInvitedByUser } = invitation.invitedByUser;
    invitation.invitedByUser = {
      ...restInvitedByUser,
      email: decryptEmail(email),
    };
    return this.toInvitationDto(invitation);
  }

  async update(
    userId: number,
    invitationToken: string,
    updateInvitationDto: UpdateInvitationDto,
  ): Promise<InvitationDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw AppException.userNotFound();
    }
    const invitation = await this.invitationsRepository.findOne({
      where: { invitationToken, email: user.email },
      relations: ['invitedByUser', 'organization', 'team'],
    });
    if (!invitation) {
      throw AppException.invitationNotFound();
    }
    if (updateInvitationDto.status) {
      await this.entityManager.transaction(async (entityManager) => {
        invitation.status = updateInvitationDto.status;
        switch (updateInvitationDto.status) {
          case InvitationStatus.ACCEPTED:
            invitation.acceptedAt = new Date();
            const userOrganization = await entityManager.exists(
              UserOrganization,
              {
                where: {
                  userId: user.id,
                  organizationId: invitation.organizationId,
                },
              },
            );
            if (userOrganization) {
              throw AppException.invitationAlreadyAccepted();
            }
            try {
              await entityManager.update(
                UserOrganization,
                { userId: user.id },
                { isDefault: 0 },
              );
              await entityManager.insert(UserOrganization, {
                userId: user.id,
                organizationId: invitation.organizationId,
                organizationRole: invitation.organizationRole,
                isDefault: 1,
              });
              if (invitation.teamId) {
                await entityManager.insert(UserTeam, {
                  userId: user.id,
                  teamId: invitation.teamId,
                  organizationId: invitation.organizationId,
                });
              }
            } catch (error) {
              console.error(error);
              throw AppException.invitationAlreadyAccepted();
            }
            switch (invitation.invitationType) {
              case InvitationType.ORGANIZATION:
                break;
              case InvitationType.LICENSE:
                break;
              case InvitationType.ORGANIZATION_LICENSE:
                const organizationLicenseGroup = await entityManager.findOne(
                  OrganizationLicenseGroup,
                  {
                    where: {
                      organizationId: invitation.organizationId,
                    },
                    relations: ['licenseGroup'],
                    order: {
                      licenseGroup: {
                        expiredAt: 'DESC',
                      },
                    },
                  },
                );
                if (!organizationLicenseGroup) {
                  throw AppException.licenseNotFound();
                }
                await entityManager.save(invitation);
                await this.licenseService.createOrganizationLicense(
                  entityManager,
                  organizationLicenseGroup.licenseGroup,
                  user,
                );
                break;
            }
            break;
          case InvitationStatus.DECLINED:
            invitation.declinedAt = new Date();
            break;
        }
        await entityManager.save(invitation);
      });
    }
    return this.toInvitationDto(invitation);
  }

  async remove(userId: number, invitationToken: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw AppException.userNotFound();
    }
    const invitation = await this.invitationsRepository.findOne({
      where: { invitationToken, email: user.email },
    });
    if (!invitation) {
      throw AppException.invitationNotFound();
    }
    await this.invitationsRepository.softDelete(invitation.id);
  }
}
