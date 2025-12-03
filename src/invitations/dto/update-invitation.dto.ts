import { PartialType } from '@nestjs/mapped-types';
import { CreateInvitationDto } from './create-invitation.dto';
import { InvitationStatus } from 'src/utils/constants';

export class UpdateInvitationDto extends PartialType(CreateInvitationDto) {
  status?: InvitationStatus;
}
