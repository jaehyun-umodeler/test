import { SetMetadata } from '@nestjs/common';
import { OrganizationRole } from 'src/utils/constants';

/**
 * 조직 역할 메타데이터 키
 */
export const ORGANIZATION_ROLES_KEY = 'organizationRoles';

/**
 * 조직 역할 데코레이터
 * @param organizationRole 조직 역할
 */
export const OrganizationRoles = (...organizationRoles: OrganizationRole[]) =>
  SetMetadata(ORGANIZATION_ROLES_KEY, organizationRoles);
