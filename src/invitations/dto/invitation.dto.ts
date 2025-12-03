import { Invitation } from 'src/invitations/entities/invitation.entity';
import { User } from 'src/users/entities/user.entity';
import { Organization } from 'src/organization/entities/organization.entity';
import { Team } from 'src/team/entities/team.entity';
import {
  InvitationStatus,
  InvitationType,
  OrganizationRole,
} from 'src/utils/constants';

export class InvitationDto {
  id: number;
  email: string;
  invitationType: InvitationType;
  status: InvitationStatus;
  invitedByUser: User;
  organization: Organization;
  organizationRole: OrganizationRole;
  team: Team;
  invitationToken: string;
  expiresAt: Date;
  acceptedAt: Date;
  declinedAt: Date;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  constructor(invitation: Invitation) {
    this.id = invitation.id;
    this.email = invitation.email;
    this.invitationType = invitation.invitationType;
    this.status = invitation.status;
    this.invitedByUser = invitation.invitedByUser;
    this.organization = invitation.organization;
    this.team = invitation.team;
    this.organizationRole = invitation.organizationRole;
    this.invitationToken = invitation.invitationToken;
    this.expiresAt = invitation.expiresAt;
    this.acceptedAt = invitation.acceptedAt;
    this.declinedAt = invitation.declinedAt;
    this.message = invitation.message;
    this.createdAt = invitation.createdAt;
    this.updatedAt = invitation.updatedAt;
    this.deletedAt = invitation.deletedAt;
  }
}
