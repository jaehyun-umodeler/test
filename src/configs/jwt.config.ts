import { registerAs } from '@nestjs/config';

/**
 * 토큰 관련 설정
 */
export default registerAs('jwt', () => ({
  /** 시크릿 키 설정 */
  secret: {
    /** 검증 토큰 시크릿 키 */
    verification: process.env.JWT_SECRET_VERIFICATION,
    /** 액세스 토큰 시크릿 키 */
    access: process.env.JWT_SECRET_ACCESS,
    /** 리프레시 토큰 시크릿 키 */
    refresh: process.env.JWT_SECRET_REFRESH,
    /** 허브 토큰 시크릿 키 */
    hub: process.env.JWT_SECRET_HUB,
  },
  /** 토큰 만료 시간 설정 (초 단위) */
  expiresIn: {
    /** 검증 토큰 만료 시간: 3분 */
    verification: 3 * 60,
    /** 액세스 토큰 만료 시간: 15분 */
    access: 15 * 60,
    /** 리프레시 토큰 만료 시간: 14일 */
    refresh: 14 * 24 * 60 * 60,
  },
  /** 토큰 쿠키 이름 설정 */
  cookieName: {
    /** 검증 토큰 쿠키 이름 */
    verification: 'verification_token',
    /** 액세스 토큰 쿠키 이름 */
    access: 'access_token',
    /** 리프레시 토큰 쿠키 이름 */
    refresh: 'refresh_token',
  },
}));
