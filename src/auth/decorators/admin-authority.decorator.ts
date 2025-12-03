import { SetMetadata } from '@nestjs/common';
import { AdminAuthority } from 'src/utils/constants';

/**
 * 관리자 권한 메타데이터 키
 */
export const ADMIN_AUTHORITIES_KEY = 'adminAuthorities';

/**
 * 관리자 권한 데코레이터
 * @param adminAuthorities 관리자 권한
 */
export const AdminAuthorities = (...adminAuthorities: AdminAuthority[]) =>
  SetMetadata(ADMIN_AUTHORITIES_KEY, adminAuthorities);
