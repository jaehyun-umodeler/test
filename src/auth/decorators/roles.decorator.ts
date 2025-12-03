import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/auth/types/role.type';

/**
 * 역할 목록 메타데이터 키
 */
export const ROLES_KEY = 'roles';

/**
 * 역할 목록 데코레이터
 * @param roles 역할 목록
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
