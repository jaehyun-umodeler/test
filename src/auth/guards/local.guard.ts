import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { GuardProperty } from 'src/auth/types/guard-property.type';

/**
 * 이메일과 비밀번호를 사용한 로그인 인증 가드
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor() {
    super({ property: GuardProperty.LOCAL });
  }
}
