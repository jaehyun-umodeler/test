import { Injectable, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

import { GuardProperty } from 'src/auth/types/guard-property.type';

/**
 * Google OAuth 인증 가드
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private configService: ConfigService) {
    super({
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
      property: GuardProperty.ACCOUNT_LINK,
    });
  }

  /**
   * OAuth 인증 요청 처리
   * @param err 인증 에러
   * @param user 인증된 사용자 정보
   * @param info 추가 정보
   * @param context 실행 컨텍스트
   * @returns 사용자 정보 또는 리다이렉트 응답
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // OAuth 인증 실패
    if (err || !user) {
      const response = context.switchToHttp().getResponse();

      return response.redirect(
        `${
          this.configService.get<string>('domain.frontend') +
          this.configService.get<string>('oauth.callbackPath')
        }?error=OAUTH_FAILED`,
      );
    }
    return user;
  }
}
