import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

import { AccountLinkService } from 'src/account-link/account-link.service';
import { AccountLink } from 'src/account-link/entities/accountLink.entity';
import { Provider } from 'src/auth/types/provider.type';

/**
 * Google OAuth 인증 전략
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private accountLinkService: AccountLinkService,
  ) {
    super({
      clientID: configService.get<string>('oauth.google.clientId'),
      clientSecret: configService.get<string>('oauth.google.clientSecret'),
      callbackURL: `${configService.get<string>(
        'domain.backend',
      )}/auth/google/callback`,
      // state: true,
    });
  }

  /**
   * Google OAuth 검증 및 사용자 정보 처리
   * @param profile Google 사용자 프로필 정보
   * @returns 연동된 계정 정보
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<AccountLink> {
    let accountLink = await this.accountLinkService.getAccountLinkByProviderId(
      Provider.GOOGLE,
      profile.id,
    );

    if (!accountLink) {
      accountLink = {
        userId: 0,
        provider: Provider.GOOGLE,
        providerId: profile.id,
        email: profile.emails[0].value,
      } as AccountLink;
    }

    return accountLink;
  }
}
