import {
  Controller,
  UseGuards,
  Req,
  Res,
  Body,
  Get,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { I18nLang } from 'nestjs-i18n';

import { AuthService } from 'src/auth/services/auth.service';
import { TokenService } from 'src/auth/services/token.service';
import { CookieService } from 'src/auth/services/cookie.service';
import { VerificationCodeService } from 'src/auth/services/verification-code.service';
import { AccountLinkService } from 'src/account-link/account-link.service';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { LocalAuthGuard } from 'src/auth/guards/local.guard';
import {
  JwtVerificationAuthGuard,
  JwtRefreshAuthGuard,
} from 'src/auth/guards/jwt.guard';
import { GoogleAuthGuard } from 'src/auth/guards/google.guard';
import { CodeDto, VerifyCodeDto } from 'src/auth/dtos/code.dto';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import { Provider } from 'src/auth/types/provider.type';
import { validatePassword, normalizeLanguage } from 'src/utils/util';
import { AppException } from 'src/utils/app-exception';
import { ErrorCode } from 'src/utils/error-codes';

/**
 * 인증 컨트롤러
 * - 인증 코드 발송 및 검증
 * - 회원가입, 로그인, 로그아웃
 * - 토큰 갱신
 * - Google OAuth 인증
 */
@Controller('auth')
export class AuthController {
  private readonly jwtConfig: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly usersService: UsersService,
    private readonly accountLinkService: AccountLinkService,
    private readonly emailService: EmailService,
    private readonly campaignsService: CampaignsService,
  ) {
    this.jwtConfig = this.configService.get('jwt');
  }

  /**
   * 인증 코드 발송
   * @param data 인증 코드 발송 데이터
   * @param language 언어
   */
  @Post('verification-code')
  @HttpCode(HttpStatus.OK)
  async sendCode(@Body() data: CodeDto, @I18nLang() language: string) {
    const code = await this.verificationCodeService.sendCode(
      data.email,
      normalizeLanguage(language),
      data.resetPassword,
    );

    if (!code) {
      throw new AppException(ErrorCode.EMAIL_SERVICE_ERROR);
    }
  }

  /**
   * 인증 코드 검증 및 검증 토큰 발급
   * @param data 이메일 인증 코드 검증 데이터
   * @param res 응답 객체
   * @returns 검증 토큰
   */
  @Post('verification-code/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmailCode(
    @Body() data: VerifyCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.verifyCode(res, data.email, data.code);

    if (!token) {
      throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
    }

    return token;
  }

  /**
   * 사용자 액세스 토큰 갱신
   * @param req 요청 객체
   * @param res 응답 객체
   * @returns 새로운 액세스, 리프레시 토큰 쌍
   */
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.cookieService.clearTokenCookiePair(res);

    const tokenPair = await this.tokenService.refreshTokenPair(
      res,
      req.cookies[this.jwtConfig.cookieName.refresh],
    );

    return tokenPair;
  }

  /**
   * 사용자 회원가입
   * @param req 요청 객체
   * @param registerDto 사용자 등록 데이터
   * @param language 언어
   * @param res 응답 객체
   * @returns 생성된 사용자 정보
   */
  @Post('register')
  @UseGuards(JwtVerificationAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Req() req: Request,
    @Body() registerDto: RegisterDto,
    @I18nLang() language: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.cookieService.clearVerificationTokenCookie(res);

    const verificationPayload = req.verificationPayload;
    let user = await this.usersService.findByEmail(verificationPayload.email);

    // 이미 존재하는 사용자 확인
    if (user && user.validType === 'valid') {
      throw AppException.userAlreadyExists();
    }

    // 탈퇴한 사용자 계정인 경우
    if (user && user.validType === 'expired') {
      throw new AppException(ErrorCode.ACCOUNT_DISABLED);
    }

    // OAuth 제공자별 추가 검증
    if (
      !verificationPayload.provider ||
      verificationPayload.provider === Provider.LOCAL
    ) {
      // 비밀번호 형식 검증
      if (!validatePassword(registerDto.password)) {
        throw new AppException(ErrorCode.INVALID_PASSWORD_FORMAT);
      }
    } else {
      const accountLink =
        await this.accountLinkService.getAccountLinkByProviderId(
          verificationPayload.provider,
          verificationPayload.providerId,
        );

      if (accountLink) {
        throw AppException.userAlreadyExists();
      }
    }

    user = await this.authService.register(
      verificationPayload,
      registerDto,
      language,
    );

    // 토큰 쌍 생성 및 쿠키 설정
    const tokenPair = await this.authService.login(res, user);

    await this.emailService.sendWelcomeEmail(
      verificationPayload.email,
      language,
    );

    if (registerDto.campaignCode) {
      try {
        await this.campaignsService.receive(registerDto.campaignCode, user.id);
      } catch (error) {
        console.error('error : ', error);
      }
    }

    return tokenPair;
  }

  /**
   * 사용자 로그인
   * @param req 요청 객체
   * @param language 언어
   * @param res 응답 객체
   * @returns 액세스, 리프레시 토큰 쌍
   */
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request,
    @I18nLang() language: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const localUser = req.user;

    // 토큰 쌍 생성 및 쿠키 설정
    const tokenPair = await this.authService.login(res, localUser);

    // 유저 언어 업데이트
    await this.usersService.updateLanguage(localUser.id, language);

    return tokenPair;
  }

  /**
   * 사용자 로그인
   * @param req 요청 객체
   * @param language 언어
   * @param res 응답 객체
   * @returns 액세스, 리프레시 토큰 쌍
   */
  @Post('login-with-token')
  @UseGuards(JwtVerificationAuthGuard)
  @HttpCode(HttpStatus.OK)
  async loginWithToken(
    @Req() req: Request,
    @I18nLang() language: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.cookieService.clearVerificationTokenCookie(res);

    const verificationUser = req.user;

    // 토큰 쌍 생성 및 쿠키 설정
    const tokenPair = await this.authService.login(res, verificationUser);

    // 유저 언어 업데이트
    await this.usersService.updateLanguage(verificationUser.id, language);

    return tokenPair;
  }

  /**
   * 사용자 로그아웃
   * @param req 요청 객체
   * @param res 응답 객체
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.cookieService.clearTokenCookiePair(res);

    const refreshToken = req.cookies[this.jwtConfig.cookieName.refresh];

    // 토큰 삭제 및 쿠키 정리
    await this.authService.logout(refreshToken);
  }

  /**
   * 사용자 모든 세션 로그아웃
   * @param req 요청 객체
   * @param res 응답 객체
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.cookieService.clearTokenCookiePair(res);

    const refreshToken = req.cookies[this.jwtConfig.cookieName.refresh];

    // 사용자의 모든 토큰 삭제
    await this.authService.logoutAll(refreshToken);
  }

  /**
   * Google OAuth 인증
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async google() {
    // GoogleAuthGuard가 자동으로 Google OAuth 페이지로 리다이렉트
  }

  /**
   * Google OAuth 인증 콜백
   * @param req 요청 객체
   * @param res 응답 객체
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accountLink = req.accountLink;

    // Google OAuth 인증 및 리다이렉트
    await this.authService.oauthCallback(res, accountLink);
  }
}
