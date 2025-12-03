import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { SlackService } from '@/internal/slack/slack.service';
import { AppException } from '@/utils/app-exception';
import { ErrorCode } from '@/utils/error-codes';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private slackService: SlackService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorResponse: any;
    let details: string;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      errorResponse = exception.getResponse();
      if (exception.details) {
        details = `${JSON.stringify(exception.details)}`;
      }
      this.logger.warn(
        `${request.method} ${request.url} - ${exception.errorCode} ${errorResponse.error.message} ${details}`,
      );
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      errorResponse = {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message:
            typeof exceptionResponse === 'string'
              ? exceptionResponse
              : (exceptionResponse as any).message || 'An error occurred',
          httpStatus: status,
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      };
      this.logger.warn(
        `HttpException: ${status} - ${request.method} ${request.url}`,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          httpStatus: status,
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      };
      this.logger.error(
        `Unhandled Exception: ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    if (status >= 500) {
      const errorStack = exception instanceof Error ? exception.stack : '';
      let errorMessage = errorResponse.error.message;
      if (details) {
        errorMessage += ` - ${details}`;
      }
      const title = 'Server Error';
      const message = `Path: \`${request.url}\`\nMethod: \`${request.method}\`\nStatus: \`${status}\`\nUser IP: \`${request.ip}\`\nError Message: \`\`\`${errorMessage}\`\`\`\nStack Trace: \`\`\`${errorStack.slice(0, 500)}\`\`\``;
      this.slackService.sendAlert(title, message);
    }

    if (errorResponse.error) {
      errorResponse.error.path = request.url;
      errorResponse.error.method = request.method;
      errorResponse.error.userAgent = request.get('User-Agent');
      errorResponse.error.ip = request.ip;
    }

    response.status(status).json(errorResponse);
  }
}
