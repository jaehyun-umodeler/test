import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';

import { TokenPair } from '../types/jwt.type';

/**
 * 쿠키 서비스
 * - 쿠키 설정 및 관리
 */
@Injectable()
export class CookieService {
  private readonly appConfig = this.configService.get('app');
  private readonly jwtConfig = this.configService.get('jwt');

  constructor(private readonly configService: ConfigService) {}

  /**
   * 요청 객체에서 쿠키 추출
   * @param req 요청 객체
   * @param cookieName 쿠키 이름
   * @returns 쿠키 값 또는 undefined
   */
  extractCookie(req: Request, cookieName: string): string | undefined {
    return req?.cookies?.[cookieName];
  }

  /**
   * 쿠키 옵션 생성
   * @param expiresIn 쿠키 만료 시간 (초)
   * @returns 쿠키 옵션 객체
   */
  generateCookieOptions(expiresIn: number): CookieOptions {
    const isLocal = this.appConfig.environment === 'local';

    return {
      secure: !isLocal,
      httpOnly: true,
      domain: isLocal ? 'localhost' : `.umodeler.com`,
      path: '/',
      sameSite: isLocal ? 'lax' : 'none',
      maxAge: expiresIn * 1000,
    };
  }

  /**
   * 쿠키에 토큰 설정
   * @param res 응답 객체
   * @param type 토큰 타입
   * @param token 토큰
   * @param expiresIn 토큰 만료 시간 (초)
   */
  setTokenCookie(
    res: Response,
    type: string,
    token: string,
    expiresIn: number,
  ) {
    res.cookie(type, token, this.generateCookieOptions(expiresIn));
  }

  /**
   * 검증 토큰을 쿠키에 설정
   * @param res 응답 객체
   * @param token 검증 토큰
   */
  setVerificationTokenCookie(res: Response, token: string) {
    this.setTokenCookie(
      res,
      this.jwtConfig.cookieName.verification,
      token,
      this.jwtConfig.expiresIn.verification,
    );
  }

  /**
   * 쿠키에 액세스, 리프레시 토큰 쌍 설정
   * @param res 응답 객체
   * @param tokenPair 액세스, 리프레시 토큰 쌍
   */
  setTokenCookiePair(res: Response, tokenPair: TokenPair) {
    this.setTokenCookie(
      res,
      this.jwtConfig.cookieName.access,
      tokenPair.accessToken,
      this.jwtConfig.expiresIn.access,
    );
    this.setTokenCookie(
      res,
      this.jwtConfig.cookieName.refresh,
      tokenPair.refreshToken,
      this.jwtConfig.expiresIn.refresh,
    );
  }

  /**
   * 쿠키에서 토큰 삭제
   * @param res 응답 객체
   * @param type 토큰 타입
   */
  clearTokenCookie(res: Response, type: string, expiresIn: number) {
    res.clearCookie(type, this.generateCookieOptions(expiresIn));
  }

  /**
   * 검증 토큰 쿠키 삭제
   * @param res 응답 객체
   */
  clearVerificationTokenCookie(res: Response) {
    this.clearTokenCookie(
      res,
      this.jwtConfig.cookieName.verification,
      this.jwtConfig.expiresIn.verification,
    );
  }

  /**
   * 쿠키에 액세스, 리프레시 토큰 쌍 삭제
   * @param res 응답 객체
   */
  clearTokenCookiePair(res: Response) {
    this.clearTokenCookie(
      res,
      this.jwtConfig.cookieName.access,
      this.jwtConfig.expiresIn.access,
    );
    this.clearTokenCookie(
      res,
      this.jwtConfig.cookieName.refresh,
      this.jwtConfig.expiresIn.refresh,
    );
  }
}
