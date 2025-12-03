import { IsArray, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateOrganizationInvitationsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  invitationIds: number[];

  @IsNumber()
  @IsOptional()
  teamId?: number;

  @IsNumber()
  @IsOptional()
  organizationRole?: number;

  @IsNumber()
  @IsOptional()
  status?: number;

  @IsBoolean()
  @IsOptional()
  isRemove?: boolean;
}
