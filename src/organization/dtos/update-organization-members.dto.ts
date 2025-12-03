import { IsArray, IsBoolean, IsNumber } from 'class-validator';

export class UpdateOrganizationMembersDto {
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];

  @IsNumber()
  teamId: number;

  @IsNumber()
  organizationRole: number;

  @IsNumber()
  licenseManagement: number;

  @IsBoolean()
  isRemove: boolean;
}
