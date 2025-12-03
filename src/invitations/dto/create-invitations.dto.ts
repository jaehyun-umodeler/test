import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { InvitationType } from 'src/utils/constants';

export class CreateInvitationsDto {
  @IsArray()
  @IsString({ each: true })
  emails: string[];

  @IsEnum(InvitationType)
  invitationType: InvitationType;

  @IsNumber()
  organizationRole: number;

  @IsOptional()
  @IsNumber()
  teamId?: number;
}
