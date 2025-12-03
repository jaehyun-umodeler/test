import {
  InvitationStatus,
  InvitationType,
  OrganizationRole,
} from 'src/utils/constants';

export class CreateInvitationDto {
  email: string;
  invitationType: InvitationType;
  status: InvitationStatus;
  invitedByUserId: number;
  organizationId: number;
  teamId: number;
  organizationRole: OrganizationRole;
  invitationToken: string;
  expiresAt: Date;
  acceptedAt: Date;
  declinedAt: Date;
  message: string;
}
