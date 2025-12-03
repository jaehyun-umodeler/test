import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { TokenService } from './token.service';
import { CookieService } from './cookie.service';
import { VerificationCodeService } from './verification-code.service';
import { AccountLinkService } from 'src/account-link/account-link.service';
import { UsersService } from 'src/users/users.service';
import { AdminAdminUsersService } from 'src/admin/admin-users/admin.admin-users.service';
import { AccountLink } from 'src/account-link/entities/accountLink.entity';
import { User } from 'src/users/entities/user.entity';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import { Payload, TokenPair } from 'src/auth/types/jwt.type';
import { Provider } from 'src/auth/types/provider.type';
import { Role } from 'src/auth/types/role.type';
import { decryptEmail } from 'src/utils/util';

/**
 * 인증 서비스
 * - 사용자 로그인, 로그아웃 처리
 * - 토큰 생성, 검증, 갱신
 * - OAuth 인증 처리
 */
@Injectable()
export class AuthService {
  private readonly domainConfig = this.configService.get('domain');
  private readonly oauthConfig = this.configService.get('oauth');
  private readonly oauthCallbackPath =
    this.domainConfig.frontend + this.oauthConfig.callbackPath;

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly accountLinkService: AccountLinkService,
    private readonly usersService: UsersService,
    private readonly adminAdminUsersService: AdminAdminUsersService,
  ) {}

  /**
   * 이메일 인증 코드 검증 및 이메일 토큰 발급
   * @param res 응답 객체
   * @param email 이메일 주소
   * @param code 인증번호
   * @returns 이메일 토큰 또는 null
   */
  async verifyCode(
    res: Response,
    email: string,
    code: string,
  ): Promise<string | null> {
    // 이메일 인증 코드 검증
    const isValid = await this.verificationCodeService.verifyCode(email, code);

    if (!isValid) {
      return null;
    }

    // 검증 토큰 생성
    const user = await this.usersService.findByEmail(email);
    const payload: Payload = {
      sub: user ? user.id : 0,
      email,
      role: user ? Role.USER : Role.NEW,
      provider: Provider.LOCAL,
    };
    const token = this.tokenService.generateVerificationToken(payload);

    // 검증 토큰을 쿠키에 설정
    this.cookieService.setVerificationTokenCookie(res, token);

    return token;
  }

  /**
   * 회원 가입 처리
   * @param verificationPayload 검증 토큰 페이로드
   * @param registerDto 회원 가입 데이터
   * @param language 언어
   * @returns 생성된 사용자 정보
   */
  async register(
    verificationPayload: Payload,
    registerDto: RegisterDto,
    language: string,
  ): Promise<User> {
    const { provider, providerId, email } = verificationPayload;
    const {
      password,
      isAcceptTermsOfService,
      isAcceptMarketingActivities,
      isAcceptPrivacyPolicy,
    } = registerDto;

    // 사용자 생성
    const user = await this.usersService.create({
      email,
      password,
      isAcceptTermsOfService,
      isAcceptMarketingActivities,
      isAcceptPrivacyPolicy,
      language,
      googleId: provider === Provider.GOOGLE ? providerId : null,
    });

    // 연동된 계정 생성
    await this.accountLinkService.linkAccount(
      user.id,
      provider,
      providerId,
      email,
    );

    return await this.usersService.findByEmail(email);
  }

  /**
   * 액세스, 리프레시 토큰 쿠키 저장
   * @param res 응답 객체
   * @param user 검증된 사용자 정보
   * @returns 액세스, 리프레시 토큰 쌍
   */
  async login(res: Response, user: User): Promise<TokenPair> {
    // 액세스, 리프레시 토큰 쌍 생성
    const admin = await this.adminAdminUsersService.findOneByUserId(user.id);
    const payload: Payload = {
      sub: user.id,
      email: decryptEmail(user.email),
      role: admin ? Role.ADMIN : Role.USER,
      provider: Provider.LOCAL,
    };
    const tokenPair = this.tokenService.generateTokenPair(payload);

    // 데이터베이스에 리프레시 토큰 저장
    await this.tokenService.saveRefreshToken(tokenPair.refreshToken);

    // 쿠키에 액세스, 리프레시 토큰 쌍 설정
    this.cookieService.setTokenCookiePair(res, tokenPair);

    return tokenPair;
  }

  /**
   * 액세스, 리프레시 토큰 쿠키 삭제
   * @param refreshToken 리프레시 토큰
   */
  async logout(refreshToken?: string) {
    // 데이터베이스에서 리프레시 토큰 삭제
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken);
    }
  }

  /**
   * 사용자의 모든 액세스, 리프레시 토큰 쿠키 삭제
   * @param refreshToken 리프레시 토큰
   */
  async logoutAll(refreshToken?: string) {
    // 데이터베이스에서 사용자의 모든 리프레시 토큰 삭제
    if (refreshToken) {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);

      if (payload) {
        await this.tokenService.revokeAllRefreshTokens(payload.sub);
      }
    }
  }

  /**
   * OAuth 인증 처리 및 리다이렉트
   * @param res 응답 객체
   * @param accountLink 연동된 계정 정보
   * @returns 리다이렉트
   */
  async oauthCallback(res: Response, accountLink: AccountLink) {
    if (!accountLink) {
      return;
    }

    const payload: Payload = {
      sub: 0,
      email: '',
      role: Role.NEW,
      provider: accountLink.provider,
      providerId: accountLink.providerId,
    };

    try {
      // 연동된 계정이 없는 경우
      if (accountLink.userId === 0) {
        Object.assign(payload, {
          email: accountLink.email,
        });

        const user = await this.usersService.findByEmail(accountLink.email);

        if (user) {
          Object.assign(payload, {
            sub: user.id,
          });
        }
      } else {
        // 기존 사용자인 경우
        const user = await this.usersService.findById(accountLink.userId);

        Object.assign(payload, {
          sub: accountLink.userId,
          email: decryptEmail(user.email),
          role: Role.USER,
        });
      }

      if (!payload) {
        return res.redirect(`${this.oauthCallbackPath}?error=OAUTH_FAILED`);
      }

      const verificationToken =
        this.tokenService.generateVerificationToken(payload);

      // 검증 토큰을 쿠키에 설정
      this.cookieService.setVerificationTokenCookie(res, verificationToken);

      return res.redirect(
        `${this.oauthCallbackPath}?verification_token=${verificationToken}`,
      );
    } catch {
      return res.redirect(`${this.oauthCallbackPath}?error=OAUTH_FAILED`);
    }
  }
}
