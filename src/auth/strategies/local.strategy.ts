import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Request } from 'express';

import { UsersService } from 'src/users/users.service';
import { Role } from 'src/auth/types/role.type';
import { Payload } from 'src/auth/types/jwt.type';
import { GuardProperty } from 'src/auth/types/guard-property.type';
import { encryptPassword } from 'src/utils/util';
import { AppException } from 'src/utils/app-exception';
import { ErrorCode } from 'src/utils/error-codes';
import { AdminAdminUsersService } from 'src/admin/admin-users/admin.admin-users.service';

/**
 * 이메일과 비밀번호를 사용한 로그인 인증 전략
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private adminAdminUsersService: AdminAdminUsersService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  /**
   * 사용자 인증 검증
   * @param email 이메일 주소
   * @param password 비밀번호 (평문)
   * @returns 검증된 사용자 정보
   */
  async validate(
    req: Request,
    email: string,
    password: string,
  ): Promise<Payload> {
    const user = await this.usersService.findByEmail(email);

    // 사용자가 존재하지 않는 경우
    if (!user || user.validType === 'unknown' || user.validType === 'invalid') {
      throw AppException.userNotFound();
    }

    // 탈퇴한 사용자 계정인 경우
    if (user.validType === 'expired') {
      throw new AppException(ErrorCode.ACCOUNT_DISABLED);
    }

    // 비밀번호 검증
    if (user.password !== encryptPassword(password)) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    const admin = await this.adminAdminUsersService.findOneByUserId(user.id);

    req[GuardProperty.USER] = user;

    return {
      sub: user.id,
      email: user.email,
      role: admin ? Role.ADMIN : Role.USER,
    };
  }
}
