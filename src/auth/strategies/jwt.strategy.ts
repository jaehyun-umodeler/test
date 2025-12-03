import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import { CookieService } from '../services/cookie.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { Payload } from 'src/auth/types/jwt.type';
import { Provider } from 'src/auth/types/provider.type';
import { HubPayload } from 'src/common/types/hub';
import { GuardProperty } from 'src/auth/types/guard-property.type';
import { validateEmail } from 'src/utils/util';
import { AppException } from 'src/utils/app-exception';

/**
 * 사용자 유효성 검증 함수
 * @param usersService 사용자 서비스
 * @param payload JWT 페이로드
 */
async function validateUser(
  usersService: UsersService,
  payload: Payload,
): Promise<User> {
  const user = await usersService.findById(payload.sub);

  if (!user || user.validType === 'unknown' || user.validType === 'invalid') {
    throw AppException.unauthorized();
  }
  if (user.validType === 'expired') {
    throw AppException.unauthorized();
  }

  return user;
}

/**
 * 검증 토큰 검증 전략
 */
@Injectable()
export class JwtVerificationStrategy extends PassportStrategy(
  Strategy,
  'jwt-verification',
) {
  constructor(
    private configService: ConfigService,
    private cookieService: CookieService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (req: Request) =>
        cookieService.extractCookie(
          req,
          configService.get<string>('jwt.cookieName.verification'),
        ),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret.verification'),
      passReqToCallback: true,
      property: GuardProperty.VERIFICATION,
    });
  }

  /**
   * 검증 토큰 페이로드 검증
   * @param req 요청 객체
   * @param payload 페이로드
   * @returns 검증된 페이로드
   */
  async validate(req: Request, payload: Payload): Promise<Payload> {
    const user = await this.usersService.findById(payload.sub);

    // 이메일 형식 검증
    if (!validateEmail(payload.email)) {
      throw AppException.unauthorized();
    }

    // OAuth 제공자 ID 검증
    if (
      payload.provider &&
      payload.provider !== Provider.LOCAL &&
      !payload.providerId
    ) {
      throw AppException.unauthorized();
    }

    req[GuardProperty.USER] = user;

    return payload;
  }
}

/**
 * 액세스 토큰 검증 전략
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private configService: ConfigService,
    private cookieService: CookieService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (req: Request) =>
        cookieService.extractCookie(
          req,
          configService.get<string>('jwt.cookieName.access'),
        ),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret.access'),
      passReqToCallback: true,
      property: GuardProperty.ACCESS,
    });
  }

  /**
   * 액세스 토큰 페이로드 검증
   * @param req 요청 객체
   * @param payload 페이로드
   * @returns 검증된 페이로드
   */
  async validate(req: Request, payload: Payload): Promise<Payload> {
    const user = await validateUser(this.usersService, payload);

    req[GuardProperty.USER] = user;

    return payload;
  }
}

/**
 * 리프레시 토큰 검증 전략
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private cookieService: CookieService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (req: Request) =>
        cookieService.extractCookie(
          req,
          configService.get<string>('jwt.cookieName.refresh'),
        ),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret.refresh'),
      passReqToCallback: true,
      property: GuardProperty.REFRESH,
    });
  }

  /**
   * 리프레시 토큰 검증
   * @param req 요청 객체
   * @param payload 페이로드
   * @returns 검증된 리프레시 토큰
   */
  async validate(req: Request, payload: Payload): Promise<Payload> {
    const user = await validateUser(this.usersService, payload);

    req[GuardProperty.USER] = user;

    return payload;
  }
}

/**
 * 허브 토큰 검증 전략
 */
@Injectable()
export class JwtHubStrategy extends PassportStrategy(Strategy, 'jwt-hub') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get<string>('jwt.secret.hub'),
      property: GuardProperty.HUB,
    });
  }

  /**
   * 허브 토큰 검증
   * @param payload 페이로드
   * @returns 검증된 허브 토큰
   */
  async validate(payload: HubPayload): Promise<HubPayload> {
    return payload;
  }
}
