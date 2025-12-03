import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleOidcGuard implements CanActivate {
  private readonly logger = new Logger(GoogleOidcGuard.name);
  private client: OAuth2Client;

  constructor(private configService: ConfigService) {
    this.client = new OAuth2Client();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      this.logger.warn('Missing Authorization Header');
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      this.logger.warn('Invalid Token Format');
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const expectedAudience = this.configService.get<string>(
        'GOOGLE_CLOUD_RUN_URL',
      );
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: expectedAudience,
      });
      const payload = ticket.getPayload();
      request['user'] = {
        email: payload.email,
        sub: payload.sub,
      };
      return true;
    } catch (error) {
      this.logger.error(`Token Verification Failed: ${error.message}`);
      throw new UnauthorizedException('Invalid Google OIDC Token');
    }
  }
}
