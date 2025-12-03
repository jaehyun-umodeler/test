import { LicenseCategory } from 'src/utils/constants';

export class BenefitDataDto {
  constructor(
    title?: string,
    resourceFileId?: number,
    resourceFileUrl?: string,
    days?: number,
    licenseCategory?: LicenseCategory,
  ) {
    this.title = title;
    this.resourceFileId = resourceFileId;
    this.resourceFileUrl = resourceFileUrl;
    this.days = days;
    this.licenseCategory = licenseCategory;
  }

  title?: string;
  resourceFileId?: number;
  resourceFileUrl?: string;
  days?: number;
  licenseCategory?: LicenseCategory;
}
