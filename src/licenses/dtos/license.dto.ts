import { License } from 'src/licenses/entities/license.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { decryptEmail } from 'src/utils/util';

export interface LicenseGroupInfo {
  id: number;
  groupId: string;
  createdAt: Date;
  expiredAt: Date;
  licenseCategory: number;
  etc: string;
  price: number;
  groupOwner: {
    id: number;
    email: string;
    fullname: string;
  }[];
  groupManager: {
    id: number;
    email: string;
    fullname: string;
  }[];
  subscription: Subscription | null;
}
export class LicenseDto {
  id: number;
  licenseCode: string;
  revokedAt: Date | null;
  createdAt: Date;
  isDefault: boolean;
  user: {
    id: number;
    email: string;
    fullname: string;
    countryCode?: string;
    language?: string;
    validType?: string;
    googleId?: string;
  } | null;
  licenseGroup?: LicenseGroupInfo;

  constructor(license: License) {
    this.id = license.id;
    this.licenseCode = license.licenseCode;
    this.revokedAt = license.revokedAt;
    this.createdAt = license.createdAt;
    this.isDefault = license.isDefault;

    if (license.user) {
      this.user = {
        id: license.user.id,
        email: decryptEmail(license.user.email),
        fullname: license.user.fullname,
        countryCode: license.user.countryCode,
        language: license.user.language,
        validType: license.user.validType,
        googleId: license.user.googleId,
      };
    } else if ((license as any).userId) {
      this.user = {
        id: (license as any).userId,
        email: '',
        fullname: '',
      };
    } else {
      this.user = null;
    }

    if (license.licenseGroup) {
      const lg = license.licenseGroup;
      this.licenseGroup = {
        id: lg.id,
        groupId: lg.groupId,
        createdAt: lg.createdAt,
        expiredAt: lg.expiredAt,
        licenseCategory: lg.licenseCategory,
        etc: lg.etc,
        price: lg.price,
        groupOwner: lg.groupOwner
          ? lg.groupOwner.map((owner) => ({
              id: owner.id,
              email: decryptEmail(owner.email),
              fullname: owner.fullname,
            }))
          : [],
        groupManager: lg.groupManager
          ? lg.groupManager.map((manager) => ({
              id: manager.id,
              email: decryptEmail(manager.email),
              fullname: manager.fullname,
            }))
          : [],
        subscription: lg.subscription || null,
      };
    }
  }
}
