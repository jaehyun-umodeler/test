import { IsString, IsDateString } from 'class-validator';

export class CreateLicenseDto {
  @IsString()
  licenseKey: string;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  expiredAt: Date;
}