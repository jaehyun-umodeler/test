import { HttpException } from '@nestjs/common';

import { ErrorCode, ErrorHttpStatus, ErrorMessages } from './error-codes';

export class AppException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: any;

  constructor(errorCode: ErrorCode, details?: any, customMessage?: string) {
    const message = customMessage || ErrorMessages[errorCode];
    const status = ErrorHttpStatus[errorCode];

    super(
      {
        success: false,
        error: {
          code: errorCode,
          message,
          httpStatus: status,
          timestamp: new Date().toISOString(),
          details,
        },
      },
      status,
    );

    this.errorCode = errorCode;
    this.details = details;
  }

  // Static factory methods for common errors
  static unauthorized(message?: string, details?: any): AppException {
    return new AppException(ErrorCode.UNAUTHORIZED, details, message);
  }

  static forbidden(message?: string, details?: any): AppException {
    return new AppException(ErrorCode.FORBIDDEN, details, message);
  }

  static notFound(message?: string, details?: any): AppException {
    return new AppException(ErrorCode.RECORD_NOT_FOUND, details, message);
  }

  static validationError(message?: string, details?: any): AppException {
    return new AppException(ErrorCode.VALIDATION_ERROR, details, message);
  }

  static conflict(details?: any): AppException {
    return new AppException(ErrorCode.RECORD_ALREADY_EXISTS, details);
  }

  static internalError(details?: any): AppException {
    return new AppException(ErrorCode.INTERNAL_SERVER_ERROR, details);
  }

  static badRequest(message?: string, details?: any): AppException {
    return new AppException(ErrorCode.VALIDATION_ERROR, details, message);
  }

  static insufficientPermissions(details?: any): AppException {
    return new AppException(ErrorCode.INSUFFICIENT_PERMISSIONS, details);
  }

  // Domain-specific factory methods
  static userNotFound(details?: any): AppException {
    return new AppException(ErrorCode.USER_NOT_FOUND, details);
  }

  static userAlreadyExists(details?: any): AppException {
    return new AppException(ErrorCode.USER_ALREADY_EXISTS, details);
  }

  static emailAlreadyExists(details?: any): AppException {
    return new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, details);
  }

  static organizationAlreadyExists(details?: any): AppException {
    return new AppException(ErrorCode.ORGANIZATION_ALREADY_EXISTS, details);
  }

  static organizationNotFound(details?: any): AppException {
    return new AppException(ErrorCode.ORGANIZATION_NOT_FOUND, details);
  }

  static organizationAccessDenied(details?: any): AppException {
    return new AppException(ErrorCode.ORGANIZATION_ACCESS_DENIED, details);
  }

  static teamNotFound(details?: any): AppException {
    return new AppException(ErrorCode.TEAM_NOT_FOUND, details);
  }
  static teamAlreadyExists(details?: any): AppException {
    return new AppException(ErrorCode.TEAM_ALREADY_EXISTS, details);
  }

  static teamAccessDenied(details?: any): AppException {
    return new AppException(ErrorCode.TEAM_ACCESS_DENIED, details);
  }

  static invalidTeamName(details?: any): AppException {
    return new AppException(ErrorCode.INVALID_TEAM_NAME, details);
  }

  static invitationNotFound(details?: any): AppException {
    return new AppException(ErrorCode.INVITATION_NOT_FOUND, details);
  }

  static invitationExpired(details?: any): AppException {
    return new AppException(ErrorCode.INVITATION_EXPIRED, details);
  }

  static invitationAlreadyAccepted(details?: any): AppException {
    return new AppException(ErrorCode.INVITATION_ALREADY_ACCEPTED, details);
  }

  static invalidInvitationToken(details?: any): AppException {
    return new AppException(ErrorCode.INVALID_INVITATION_TOKEN, details);
  }

  static licenseNotFound(details?: any): AppException {
    return new AppException(ErrorCode.LICENSE_NOT_FOUND, details);
  }

  static licenseExpired(details?: any): AppException {
    return new AppException(ErrorCode.LICENSE_EXPIRED, details);
  }

  static licenseIssueLimitExceeded(details?: any): AppException {
    return new AppException(ErrorCode.LICENSE_ISSUE_LIMIT_EXCEEDED, details);
  }

  static paymentFailed(details?: any): AppException {
    return new AppException(ErrorCode.PAYMENT_FAILED, details);
  }

  static fileNotFound(details?: any): AppException {
    return new AppException(ErrorCode.FILE_NOT_FOUND, details);
  }

  static fileTooLarge(details?: any): AppException {
    return new AppException(ErrorCode.FILE_TOO_LARGE, details);
  }

  static invalidFileType(details?: any): AppException {
    return new AppException(ErrorCode.INVALID_FILE_TYPE, details);
  }

  static uploadFailed(details?: any): AppException {
    return new AppException(ErrorCode.UPLOAD_FAILED, details);
  }

  static rateLimitExceeded(details?: any): AppException {
    return new AppException(ErrorCode.RATE_LIMIT_EXCEEDED, details);
  }

  static serviceUnavailable(details?: any): AppException {
    return new AppException(ErrorCode.SERVICE_UNAVAILABLE, details);
  }

  static subscriptionNotFound(details?: any): AppException {
    return new AppException(ErrorCode.SUBSCRIPTION_NOT_FOUND, details);
  }

  static tutorialFileNotFound(details?: any): AppException {
    return new AppException(ErrorCode.TUTORIAL_FILE_NOT_FOUND, details);
  }

  static memberAlreadyExists(details?: any): AppException {
    return new AppException(ErrorCode.MEMBER_ALREADY_EXISTS, details);
  }

  static campaignNotFound(details?: any): AppException {
    return new AppException(ErrorCode.CAMPAIGN_NOT_FOUND, details);
  }

  static campaignAlreadyExists(details?: any): AppException {
    return new AppException(ErrorCode.CAMPAIGN_ALREADY_EXISTS, details);
  }
  static campaignNotInDateRange(details?: any): AppException {
    return new AppException(ErrorCode.CAMPAIGN_NOT_IN_DATE_RANGE, details);
  }

  static benefitNotFound(details?: any): AppException {
    return new AppException(ErrorCode.BENEFIT_NOT_FOUND, details);
  }

  static benefitAlreadyReceived(details?: any): AppException {
    return new AppException(ErrorCode.BENEFIT_ALREADY_RECEIVED, details);
  }

  static benefitNotInDateRange(details?: any): AppException {
    return new AppException(ErrorCode.BENEFIT_NOT_IN_DATE_RANGE, details);
  }
}
