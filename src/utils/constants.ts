export enum PLAN_ENUM {
  PERSONAL = 'Personal',
  PRO = 'Pro',
  ENTERPRISE = 'Enterprise',
}

export enum PKG_ENUM {
  UM_X_PLUS = 'UModeler X Plus',
  UM_NORMAL = 'UModeler',
}

export enum DR_ENUM {
  PRO_INV = 50,
  PER_INV = 30,
  PER_X_PLUS = 100,
}

export enum AdminAuthority {
  VIEWER = 0,
  EDITOR = 1,
  ADMIN = 2,
}

export enum OrganizationRole {
  USER = 0,
  MANAGER = 1,
  OWNER = 2,
}

export enum InvitationStatus {
  PENDING = 0,
  ACCEPTED = 1,
  DECLINED = 2,
  // EXPIRED = 3,
  // CANCELLED = 4,
}

export enum InvitationType {
  ORGANIZATION = 0,
  LICENSE = 1,
  ORGANIZATION_LICENSE = 2,
}

export enum LicenseCategory {
  PRO = 0,
  ART = 1,
  ALL = 2,
  EDU = 3,
  ENT = 5,
  PER = 6,
}

export enum PlanType {
  PRO_PERSONAL = 0,
  PRO = 1,
  ENTERPRISE = 2,
}

export enum LicenseCode {
  PRO = 'PRO',
  ART = 'ART',
  ALL = 'ALL',
  EDU = 'EDU',
  ENT = 'ENT',
  PER = 'PER',
}

export enum LicenseManagementStatus {
  ISSUE = 0,
  REVOKE = 1,
}

export enum OwnerType {
  USER = 0,
  ORGANIZATION = 1,
}

export enum PaymentMethodType {
  CARD = 0,
  BANK_ACCOUNT = 1,
  PAYPAL = 2,
}

export enum SubscriptionStatus {
  NONE = 0,
  ACTIVE = 1,
  PAYMENT_FAILED = 2,
  CANCELLED = 3,
  EXPIRED = 4,
  CANCELLATION_REQUESTED = 5,
}

export enum BillingCycle {
  MONTHLY = 0,
  YEARLY = 1,
}

export enum FolderType {
  IMAGE = 0,
  VIDEO = 1,
  TEMPLATE = 2,
  PACKAGE = 3,
  TUTORIAL = 4,
  OTHER = 5,
}

export enum TutorialDifficulty {
  EASY = 0,
  MEDIUM = 1,
  HARD = 2,
}

export enum CampaignType {
  PROMOTION = 0,
  AFFILIATE = 1,
}

export enum BenefitType {
  FREE_ASSET = 0,
  FREE_LICENSE = 1,
  LICENSE_EXTENSION = 2,
}

/**
 * 지원하는 언어 목록
 */
export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const invalidTeamNames = ['allteams', '모든조직', '모든팀', '모든부서'];
