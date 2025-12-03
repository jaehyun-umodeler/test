import { HttpStatus } from '@nestjs/common';

// Error codes and messages for client responses
export enum ErrorCode {
  // Authentication & Authorization Errors (1000-1999)
  UNAUTHORIZED = 1001,
  FORBIDDEN = 1002,
  TOKEN_EXPIRED = 1003,
  TOKEN_INVALID = 1004,
  INVALID_CREDENTIALS = 1005,
  ACCOUNT_LOCKED = 1006,
  ACCOUNT_DISABLED = 1007,
  EMAIL_NOT_VERIFIED = 1008,
  INSUFFICIENT_PERMISSIONS = 1009,

  // Validation Errors (2000-2999)
  VALIDATION_ERROR = 2001,
  REQUIRED_FIELD_MISSING = 2002,
  INVALID_EMAIL_FORMAT = 2003,
  INVALID_PASSWORD_FORMAT = 2004,
  INVALID_PHONE_FORMAT = 2005,
  INVALID_DATE_FORMAT = 2006,
  INVALID_URL_FORMAT = 2007,
  FIELD_TOO_LONG = 2008,
  FIELD_TOO_SHORT = 2009,
  INVALID_ENUM_VALUE = 2010,

  // User Management Errors (3000-3999)
  USER_NOT_FOUND = 3001,
  USER_ALREADY_EXISTS = 3002,
  EMAIL_ALREADY_EXISTS = 3003,
  USERNAME_ALREADY_EXISTS = 3004,
  USER_PROFILE_INCOMPLETE = 3005,
  USER_ALREADY_ACTIVE = 3006,
  USER_ALREADY_INACTIVE = 3007,

  // Organization & Team Errors (4000-4999)
  ORGANIZATION_NOT_FOUND = 4001,
  ORGANIZATION_ALREADY_EXISTS = 4002,
  ORGANIZATION_ACCESS_DENIED = 4003,
  ORGANIZATION_LIMIT_REACHED = 4004,
  TEAM_NOT_FOUND = 4005,
  TEAM_ALREADY_EXISTS = 4006,
  TEAM_ACCESS_DENIED = 4007,
  TEAM_LIMIT_REACHED = 4008,
  MEMBER_ALREADY_EXISTS = 4009,
  MEMBER_NOT_FOUND = 4010,
  INVALID_ROLE_ASSIGNMENT = 4011,
  INVALID_TEAM_NAME = 4012,

  // Invitation Errors (5000-5999)
  INVITATION_NOT_FOUND = 5001,
  INVITATION_ALREADY_SENT = 5002,
  INVITATION_EXPIRED = 5003,
  INVITATION_ALREADY_ACCEPTED = 5004,
  INVITATION_ALREADY_DECLINED = 5005,
  INVITATION_CANCELLED = 5006,
  INVITATION_LIMIT_REACHED = 5007,
  INVALID_INVITATION_TOKEN = 5008,
  INVITATION_EMAIL_MISMATCH = 5009,

  // License & Subscription Errors (6000-6999)
  LICENSE_NOT_FOUND = 6001,
  LICENSE_EXPIRED = 6002,
  LICENSE_LIMIT_REACHED = 6003,
  LICENSE_ALREADY_ASSIGNED = 6004,
  LICENSE_ISSUE_LIMIT_EXCEEDED = 6011,
  SUBSCRIPTION_NOT_FOUND = 6005,
  SUBSCRIPTION_EXPIRED = 6006,
  SUBSCRIPTION_CANCELLED = 6007,
  PAYMENT_FAILED = 6008,
  PAYMENT_METHOD_INVALID = 6009,
  PLAN_LIMIT_EXCEEDED = 6010,

  // File & Upload Errors (7000-7999)
  FILE_NOT_FOUND = 7001,
  FILE_TOO_LARGE = 7002,
  INVALID_FILE_TYPE = 7003,
  UPLOAD_FAILED = 7004,
  FILE_CORRUPTED = 7005,
  STORAGE_QUOTA_EXCEEDED = 7006,

  // Database & System Errors (8000-8999)
  DATABASE_CONNECTION_ERROR = 8001,
  DATABASE_QUERY_ERROR = 8002,
  RECORD_NOT_FOUND = 8003,
  RECORD_ALREADY_EXISTS = 8004,
  CONSTRAINT_VIOLATION = 8005,
  TRANSACTION_FAILED = 8006,
  MIGRATION_FAILED = 8007,

  // External Service Errors (9000-9999)
  EMAIL_SERVICE_ERROR = 9001,
  SMS_SERVICE_ERROR = 9002,
  PAYMENT_SERVICE_ERROR = 9003,
  STORAGE_SERVICE_ERROR = 9004,
  THIRD_PARTY_API_ERROR = 9005,
  SERVICE_UNAVAILABLE = 9006,

  // General Application Errors (10000-10999)
  INTERNAL_SERVER_ERROR = 10001,
  SERVICE_UNAVAILABLE_ERROR = 10002,
  RATE_LIMIT_EXCEEDED = 10003,
  MAINTENANCE_MODE = 10004,
  FEATURE_NOT_AVAILABLE = 10005,
  CONFIGURATION_ERROR = 10006,
  DEPENDENCY_ERROR = 10007,

  // Campaigns & Benefits Errors (11000-11999)
  CAMPAIGN_NOT_FOUND = 11001,
  CAMPAIGN_ALREADY_EXISTS = 11002,
  CAMPAIGN_NOT_IN_DATE_RANGE = 11003,
  BENEFIT_NOT_FOUND = 11004,
  BENEFIT_ALREADY_RECEIVED = 11005,
  BENEFIT_NOT_IN_DATE_RANGE = 11006,

  // Tutorials & Guides Errors (12000-12999)
  TUTORIAL_FILE_NOT_FOUND = 12001,
}

export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication & Authorization Errors
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.FORBIDDEN]: 'Access denied',
  [ErrorCode.TOKEN_EXPIRED]: 'Token has expired',
  [ErrorCode.TOKEN_INVALID]: 'Invalid token',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.ACCOUNT_LOCKED]: 'Account is locked',
  [ErrorCode.ACCOUNT_DISABLED]: 'Account is disabled',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Email address not verified',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',

  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.REQUIRED_FIELD_MISSING]: 'Required field is missing',
  [ErrorCode.INVALID_EMAIL_FORMAT]: 'Invalid email format',
  [ErrorCode.INVALID_PASSWORD_FORMAT]: 'Password does not meet requirements',
  [ErrorCode.INVALID_PHONE_FORMAT]: 'Invalid phone number format',
  [ErrorCode.INVALID_DATE_FORMAT]: 'Invalid date format',
  [ErrorCode.INVALID_URL_FORMAT]: 'Invalid URL format',
  [ErrorCode.FIELD_TOO_LONG]: 'Field exceeds maximum length',
  [ErrorCode.FIELD_TOO_SHORT]: 'Field is too short',
  [ErrorCode.INVALID_ENUM_VALUE]: 'Invalid value provided',

  // User Management Errors
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Email address already registered',
  [ErrorCode.USERNAME_ALREADY_EXISTS]: 'Username already taken',
  [ErrorCode.USER_PROFILE_INCOMPLETE]: 'User profile is incomplete',
  [ErrorCode.USER_ALREADY_ACTIVE]: 'User is already active',
  [ErrorCode.USER_ALREADY_INACTIVE]: 'User is already inactive',

  // Organization & Team Errors
  [ErrorCode.ORGANIZATION_NOT_FOUND]: 'Organization not found',
  [ErrorCode.ORGANIZATION_ALREADY_EXISTS]: 'Organization already exists',
  [ErrorCode.ORGANIZATION_ACCESS_DENIED]: 'Access to organization denied',
  [ErrorCode.ORGANIZATION_LIMIT_REACHED]: 'Organization limit reached',
  [ErrorCode.TEAM_NOT_FOUND]: 'Team not found',
  [ErrorCode.TEAM_ALREADY_EXISTS]: 'Team already exists',
  [ErrorCode.TEAM_ACCESS_DENIED]: 'Access to team denied',
  [ErrorCode.TEAM_LIMIT_REACHED]: 'Team limit reached',
  [ErrorCode.MEMBER_ALREADY_EXISTS]: 'Member already exists',
  [ErrorCode.MEMBER_NOT_FOUND]: 'Member not found',
  [ErrorCode.INVALID_ROLE_ASSIGNMENT]: 'Invalid role assignment',
  [ErrorCode.INVALID_TEAM_NAME]: 'Invalid team name',

  // Invitation Errors
  [ErrorCode.INVITATION_NOT_FOUND]: 'Invitation not found',
  [ErrorCode.INVITATION_ALREADY_SENT]: 'Invitation already sent',
  [ErrorCode.INVITATION_EXPIRED]: 'Invitation has expired',
  [ErrorCode.INVITATION_ALREADY_ACCEPTED]: 'Invitation already accepted',
  [ErrorCode.INVITATION_ALREADY_DECLINED]: 'Invitation already declined',
  [ErrorCode.INVITATION_CANCELLED]: 'Invitation was cancelled',
  [ErrorCode.INVITATION_LIMIT_REACHED]: 'Invitation limit reached',
  [ErrorCode.INVALID_INVITATION_TOKEN]: 'Invalid invitation token',
  [ErrorCode.INVITATION_EMAIL_MISMATCH]: 'Email does not match invitation',

  // License & Subscription Errors
  [ErrorCode.LICENSE_NOT_FOUND]: 'License not found',
  [ErrorCode.LICENSE_EXPIRED]: 'License has expired',
  [ErrorCode.LICENSE_LIMIT_REACHED]: 'License limit reached',
  [ErrorCode.LICENSE_ALREADY_ASSIGNED]: 'License already assigned',
  [ErrorCode.LICENSE_ISSUE_LIMIT_EXCEEDED]:
    'Cannot issue more licenses than allowed',
  [ErrorCode.SUBSCRIPTION_NOT_FOUND]: 'Subscription not found',
  [ErrorCode.SUBSCRIPTION_EXPIRED]: 'Subscription has expired',
  [ErrorCode.SUBSCRIPTION_CANCELLED]: 'Subscription was cancelled',
  [ErrorCode.PAYMENT_FAILED]: 'Payment failed',
  [ErrorCode.PAYMENT_METHOD_INVALID]: 'Invalid payment method',
  [ErrorCode.PLAN_LIMIT_EXCEEDED]: 'Plan limit exceeded',

  // File & Upload Errors
  [ErrorCode.FILE_NOT_FOUND]: 'File not found',
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds limit',
  [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type',
  [ErrorCode.UPLOAD_FAILED]: 'File upload failed',
  [ErrorCode.FILE_CORRUPTED]: 'File is corrupted',
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded',

  // Database & System Errors
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 'Database connection error',
  [ErrorCode.DATABASE_QUERY_ERROR]: 'Database query error',
  [ErrorCode.RECORD_NOT_FOUND]: 'Record not found',
  [ErrorCode.RECORD_ALREADY_EXISTS]: 'Record already exists',
  [ErrorCode.CONSTRAINT_VIOLATION]: 'Database constraint violation',
  [ErrorCode.TRANSACTION_FAILED]: 'Transaction failed',
  [ErrorCode.MIGRATION_FAILED]: 'Database migration failed',

  // External Service Errors
  [ErrorCode.EMAIL_SERVICE_ERROR]: 'Email service error',
  [ErrorCode.SMS_SERVICE_ERROR]: 'SMS service error',
  [ErrorCode.PAYMENT_SERVICE_ERROR]: 'Payment service error',
  [ErrorCode.STORAGE_SERVICE_ERROR]: 'Storage service error',
  [ErrorCode.THIRD_PARTY_API_ERROR]: 'Third-party API error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',

  // General Application Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCode.SERVICE_UNAVAILABLE_ERROR]: 'Service unavailable',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.MAINTENANCE_MODE]: 'System is under maintenance',
  [ErrorCode.FEATURE_NOT_AVAILABLE]: 'Feature not available',
  [ErrorCode.CONFIGURATION_ERROR]: 'Configuration error',
  [ErrorCode.DEPENDENCY_ERROR]: 'Dependency error',

  // Campaigns & Benefits Errors
  [ErrorCode.CAMPAIGN_NOT_FOUND]: 'Campaign not found',
  [ErrorCode.CAMPAIGN_ALREADY_EXISTS]: 'Campaign already exists',
  [ErrorCode.CAMPAIGN_NOT_IN_DATE_RANGE]: 'Campaign is not in date range',
  [ErrorCode.BENEFIT_NOT_FOUND]: 'Benefit not found',
  [ErrorCode.BENEFIT_ALREADY_RECEIVED]: 'Benefit already received',
  [ErrorCode.BENEFIT_NOT_IN_DATE_RANGE]: 'Benefit is not in date range',

  // Tutorials & Guides Errors
  [ErrorCode.TUTORIAL_FILE_NOT_FOUND]: 'Tutorial file not found',
};

// HTTP Status Code mapping
export const ErrorHttpStatus: Record<ErrorCode, number> = {
  // Authentication & Authorization Errors
  [ErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [ErrorCode.TOKEN_EXPIRED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.TOKEN_INVALID]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.INVALID_CREDENTIALS]: HttpStatus.BAD_REQUEST,
  [ErrorCode.ACCOUNT_LOCKED]: 423,
  [ErrorCode.ACCOUNT_DISABLED]: HttpStatus.FORBIDDEN,
  [ErrorCode.EMAIL_NOT_VERIFIED]: HttpStatus.FORBIDDEN,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: HttpStatus.FORBIDDEN,

  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [ErrorCode.REQUIRED_FIELD_MISSING]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_EMAIL_FORMAT]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_PASSWORD_FORMAT]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_PHONE_FORMAT]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_DATE_FORMAT]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_URL_FORMAT]: HttpStatus.BAD_REQUEST,
  [ErrorCode.FIELD_TOO_LONG]: HttpStatus.BAD_REQUEST,
  [ErrorCode.FIELD_TOO_SHORT]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_ENUM_VALUE]: HttpStatus.BAD_REQUEST,

  // User Management Errors
  [ErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.USER_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.USERNAME_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.USER_PROFILE_INCOMPLETE]: HttpStatus.BAD_REQUEST,
  [ErrorCode.USER_ALREADY_ACTIVE]: HttpStatus.CONFLICT,
  [ErrorCode.USER_ALREADY_INACTIVE]: HttpStatus.CONFLICT,

  // Organization & Team Errors
  [ErrorCode.ORGANIZATION_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.ORGANIZATION_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.ORGANIZATION_ACCESS_DENIED]: HttpStatus.FORBIDDEN,
  [ErrorCode.ORGANIZATION_LIMIT_REACHED]: 429,
  [ErrorCode.TEAM_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.TEAM_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.TEAM_ACCESS_DENIED]: HttpStatus.FORBIDDEN,
  [ErrorCode.TEAM_LIMIT_REACHED]: HttpStatus.TOO_MANY_REQUESTS,
  [ErrorCode.MEMBER_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.MEMBER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.INVALID_ROLE_ASSIGNMENT]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_TEAM_NAME]: HttpStatus.BAD_REQUEST,

  // Invitation Errors
  [ErrorCode.INVITATION_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.INVITATION_ALREADY_SENT]: HttpStatus.CONFLICT,
  [ErrorCode.INVITATION_EXPIRED]: HttpStatus.GONE,
  [ErrorCode.INVITATION_ALREADY_ACCEPTED]: HttpStatus.CONFLICT,
  [ErrorCode.INVITATION_ALREADY_DECLINED]: HttpStatus.CONFLICT,
  [ErrorCode.INVITATION_CANCELLED]: HttpStatus.GONE,
  [ErrorCode.INVITATION_LIMIT_REACHED]: HttpStatus.TOO_MANY_REQUESTS,
  [ErrorCode.INVALID_INVITATION_TOKEN]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVITATION_EMAIL_MISMATCH]: HttpStatus.BAD_REQUEST,

  // License & Subscription Errors
  [ErrorCode.LICENSE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.LICENSE_EXPIRED]: HttpStatus.GONE,
  [ErrorCode.LICENSE_LIMIT_REACHED]: HttpStatus.TOO_MANY_REQUESTS,
  [ErrorCode.LICENSE_ALREADY_ASSIGNED]: HttpStatus.CONFLICT,
  [ErrorCode.LICENSE_ISSUE_LIMIT_EXCEEDED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.SUBSCRIPTION_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.SUBSCRIPTION_EXPIRED]: HttpStatus.GONE,
  [ErrorCode.SUBSCRIPTION_CANCELLED]: HttpStatus.GONE,
  [ErrorCode.PAYMENT_FAILED]: HttpStatus.PAYMENT_REQUIRED,
  [ErrorCode.PAYMENT_METHOD_INVALID]: HttpStatus.BAD_REQUEST,
  [ErrorCode.PLAN_LIMIT_EXCEEDED]: HttpStatus.TOO_MANY_REQUESTS,

  // File & Upload Errors
  [ErrorCode.FILE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.FILE_TOO_LARGE]: HttpStatus.PAYLOAD_TOO_LARGE,
  [ErrorCode.INVALID_FILE_TYPE]: HttpStatus.BAD_REQUEST,
  [ErrorCode.UPLOAD_FAILED]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.FILE_CORRUPTED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: HttpStatus.PAYLOAD_TOO_LARGE,

  // Database & System Errors
  [ErrorCode.DATABASE_CONNECTION_ERROR]: HttpStatus.SERVICE_UNAVAILABLE,
  [ErrorCode.DATABASE_QUERY_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.RECORD_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.RECORD_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.CONSTRAINT_VIOLATION]: HttpStatus.BAD_REQUEST,
  [ErrorCode.TRANSACTION_FAILED]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.MIGRATION_FAILED]: HttpStatus.INTERNAL_SERVER_ERROR,

  // External Service Errors
  [ErrorCode.EMAIL_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [ErrorCode.SMS_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [ErrorCode.PAYMENT_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [ErrorCode.STORAGE_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [ErrorCode.THIRD_PARTY_API_ERROR]: HttpStatus.BAD_GATEWAY,
  [ErrorCode.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,

  // General Application Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.SERVICE_UNAVAILABLE_ERROR]: HttpStatus.SERVICE_UNAVAILABLE,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: HttpStatus.TOO_MANY_REQUESTS,
  [ErrorCode.MAINTENANCE_MODE]: HttpStatus.SERVICE_UNAVAILABLE,
  [ErrorCode.FEATURE_NOT_AVAILABLE]: HttpStatus.METHOD_NOT_ALLOWED,
  [ErrorCode.CONFIGURATION_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.DEPENDENCY_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,

  // Campaigns & Benefits Errors
  [ErrorCode.CAMPAIGN_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.CAMPAIGN_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.CAMPAIGN_NOT_IN_DATE_RANGE]: HttpStatus.BAD_REQUEST,
  [ErrorCode.BENEFIT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.BENEFIT_ALREADY_RECEIVED]: HttpStatus.CONFLICT,
  [ErrorCode.BENEFIT_NOT_IN_DATE_RANGE]: HttpStatus.BAD_REQUEST,

  // Tutorials & Guides Errors
  [ErrorCode.TUTORIAL_FILE_NOT_FOUND]: HttpStatus.NOT_FOUND,
};

// Helper function to get error response
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    httpStatus: number;
    timestamp: string;
    path?: string;
    details?: any;
  };
}

export function createErrorResponse(
  errorCode: ErrorCode,
  details?: any,
  path?: string,
): ErrorResponse {
  return {
    success: false,
    error: {
      code: errorCode,
      message: ErrorMessages[errorCode],
      httpStatus: ErrorHttpStatus[errorCode],
      timestamp: new Date().toISOString(),
      path,
      details,
    },
  };
}

// Helper function to get success response
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}
