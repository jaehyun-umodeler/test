import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

import { CookieService } from 'src/auth/services/cookie.service';
import { AdminAdminUsersService } from 'src/admin/admin-users/admin.admin-users.service';
import { RefreshToken } from 'src/auth/entities/refreshToken.entity';
import { Role } from 'src/auth/types/role.type';
import { Payload, TokenPair } from 'src/auth/types/jwt.type';
import { AppException } from 'src/utils/app-exception';

/**
 * 토큰 서비스
 * - 토큰 생성 및 검증
 * - 리프레시 토큰 데이터베이스 관리
 * - 토큰 만료 및 정리
 */
@Injectable()
export class TokenService {
  private readonly jwtConfig = this.configService.get('jwt');

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly cookieService: CookieService,
    @Inject(forwardRef(() => AdminAdminUsersService))
    private readonly adminAdminUsersService: AdminAdminUsersService,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * 토큰 생성
   * @param payload 페이로드
   * @param secret 시크릿 키
   * @param expiresIn 만료 시간 (초)
   * @returns 생성된 토큰
   */
  generateToken(payload: Payload, secret: string, expiresIn: number): string {
    return this.jwtService.sign(payload, {
      secret: secret,
      expiresIn: `${expiresIn}s`,
    });
  }

  /**
   * 검증 토큰 생성
   * @param payload 페이로드
   * @returns 생성된 검증 토큰
   */
  generateVerificationToken(payload: Payload): string {
    return this.generateToken(
      payload,
      this.jwtConfig.secret.verification,
      this.jwtConfig.expiresIn.verification,
    );
  }

  /**
   * 액세스, 리프레시 토큰 쌍 생성
   * @param payload 검증된 페이로드
   * @returns 액세스, 리프레시 토큰 쌍
   */
  generateTokenPair(payload: Payload): TokenPair {
    // 토큰 페이로드 정리
    const { sub, email, role, provider, providerId } = payload;
    const newPayload: Payload = {
      sub,
      email,
      role,
      provider,
      providerId,
    };

    // 액세스, 리프레시 토큰 생성
    const accessToken = this.generateToken(
      newPayload,
      this.jwtConfig.secret.access,
      this.jwtConfig.expiresIn.access,
    );
    const refreshToken = this.generateToken(
      newPayload,
      this.jwtConfig.secret.refresh,
      this.jwtConfig.expiresIn.refresh,
    );

    return { accessToken, refreshToken };
  }

  /**
   * 리프레시 토큰을 데이터베이스에 저장
   * @param token 리프레시 토큰
   * @returns 저장된 리프레시 토큰 엔티티
   */
  async saveRefreshToken(token: string): Promise<RefreshToken> {
    const decoded = this.jwtService.decode(token) as any;
    const expiresAt = new Date(decoded.exp * 1000);
    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId: decoded.sub,
      expiresAt,
    });

    // 데이터베이스에 저장
    return await this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * 액세스, 리프레시 토큰 쌍 갱신
   * @param token 검증된 리프레시 토큰
   * @returns 새로운 액세스, 리프레시 토큰 쌍
   */
  async refreshTokenPair(res: Response, token: string): Promise<TokenPair> {
    return await this.entityManager.transaction(async (manager) => {
      let payload = this.jwtService.verify<Payload>(token, {
        secret: this.jwtConfig.secret.refresh,
      });

      // JWT 토큰 서명 검증
      if (!payload) {
        throw AppException.unauthorized();
      }

      // SELECT FOR UPDATE로 비관적 락 적용하여 동시성 제어
      const refreshToken = await manager
        .createQueryBuilder(RefreshToken, 'rt')
        .where('rt.token = :token', { token })
        .setLock('pessimistic_write')
        .getOne();

      // 데이터베이스에 토큰이 존재하지 않거나 만료된 경우
      if (!refreshToken) {
        throw AppException.unauthorized();
      }

      if (refreshToken.expiresAt < new Date()) {
        // 만료된 토큰 삭제
        await manager.remove(RefreshToken, refreshToken);

        throw AppException.unauthorized();
      }

      // 새로운 페이로드 생성
      const { sub, email } = payload;
      const admin = await this.adminAdminUsersService.findOneByUserId(sub);

      payload = {
        sub,
        email,
        role: admin ? Role.ADMIN : Role.USER,
        provider: payload.provider,
        providerId: payload.providerId,
      };

      // 새로운 액세스, 리프레시 토큰 쌍 생성
      const tokenPair = this.generateTokenPair(payload);

      // 기존 리프레시 토큰 삭제
      await manager.remove(RefreshToken, refreshToken);

      // 새로운 리프레시 토큰 저장
      const decoded = this.jwtService.decode(tokenPair.refreshToken) as any;
      const expiresAt = new Date(decoded.exp * 1000);
      const newRefreshToken = manager.create(RefreshToken, {
        token: tokenPair.refreshToken,
        userId: decoded.sub,
        expiresAt,
      });
      await manager.save(RefreshToken, newRefreshToken);

      this.cookieService.setTokenCookiePair(res, tokenPair);

      return tokenPair;
    });
  }

  /**
   * 특정 리프레시 토큰을 데이터베이스에서 삭제
   * @param token 리프레시 토큰
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token });
  }

  /**
   * 특정 사용자의 모든 리프레시 토큰을 데이터베이스에서 삭제
   * @param userId 사용자 ID
   */
  async revokeAllRefreshTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }

  /**
   * 리프레시 토큰 검증
   * @param token 리프레시 토큰
   * @returns 검증된 페이로드 또는 null
   */
  async verifyRefreshToken(token: string): Promise<Payload | null> {
    try {
      const payload = this.jwtService.verify<Payload>(token, {
        secret: this.jwtConfig.secret.refresh,
      });

      // 토큰 서명 검증
      if (!payload) {
        return null;
      }

      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { token },
      });

      // 데이터베이스에 토큰이 존재하지 않는 경우
      if (!refreshToken) {
        return null;
      }

      // 토큰이 만료된 경우
      if (refreshToken.expiresAt < new Date()) {
        // 만료된 토큰 삭제
        await this.revokeRefreshToken(token);

        return null;
      }

      // 새로운 페이로드 생성
      const { sub, email } = payload;
      const admin = await this.adminAdminUsersService.findOneByUserId(sub);

      return {
        sub,
        email,
        role: admin ? Role.ADMIN : Role.USER,
      };
    } catch (error) {
      return null;
    }
  }
}
