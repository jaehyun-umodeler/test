/**
 * 라이선스 이메일 타입
 */
export enum LicenseEmailType {
  ISSUED = 'issued',
  REVOKED = 'revoked',
  REMOVED = 'removed',
}

/**
 * 라이선스 이메일 데이터
 */
export interface LicenseEmailData {
  email: string;
  language: string;
  userName: string;
  licenseCode: string;
  ownerName?: string;
  licensePage?: string;
  licenseCategory?: number;
}
