import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { OrganizationService } from 'src/organization/organization.service';
import { AdminAdminUsersService } from 'src/admin/admin-users/admin.admin-users.service';
import { ROLES_KEY } from 'src/auth/decorators/roles.decorator';
import { ADMIN_AUTHORITIES_KEY } from '../decorators/admin-authority.decorator';
import { ORGANIZATION_ROLES_KEY } from '../decorators/organization-role.decorator';
import { Role } from 'src/auth/types/role.type';
import { Provider } from '../types/provider.type';
import { Payload } from 'src/auth/types/jwt.type';
import { GuardProperty } from 'src/auth/types/guard-property.type';
import { AdminAuthority, OrganizationRole } from 'src/utils/constants';
import { AppException } from 'src/utils/app-exception';

/**
 * 역할 인가
 * @param property 페이로드 프로퍼티 이름
 * @param context 실행 컨텍스트
 * @param reflector 리플렉터
 * @param adminAdminUsersService 관리자 서비스
 * @returns 인가 여부
 */
async function validateRoles(
  property: GuardProperty,
  context: ExecutionContext,
  reflector: Reflector,
  adminAdminUsersService: AdminAdminUsersService,
): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const payload: Payload = request[property];
  const requiredRoles = reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);

  if (requiredRoles && !requiredRoles.includes(payload.role)) {
    throw AppException.forbidden();
  }

  switch (payload.role) {
    case Role.ADMIN:
      const admin = await adminAdminUsersService.findOneByUserId(payload.sub);

      if (!admin) {
        throw AppException.forbidden();
      }

      return true;

    default:
      return true;
  }
}

/**
 * 조직 역할 인가
 * @param property 페이로드 프로퍼티 이름
 * @param context 실행 컨텍스트
 * @param reflector 리플렉터
 * @param adminAdminUsersService 관리자 서비스
 * @returns 조직 역할 인가 여부
 */
async function validateAdminAuthorities(
  property: GuardProperty,
  context: ExecutionContext,
  reflector: Reflector,
  adminAdminUsersService: AdminAdminUsersService,
): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const payload: Payload = request[property];
  const requiredAdminAuthorities = reflector.getAllAndOverride<
    AdminAuthority[]
  >(ADMIN_AUTHORITIES_KEY, [context.getHandler(), context.getClass()]);

  if (!requiredAdminAuthorities) {
    return true;
  }

  const admin = await adminAdminUsersService.findOneByUserId(payload.sub);

  if (!admin) {
    throw AppException.forbidden();
  }

  if (
    requiredAdminAuthorities.some((authority) => admin.authority < authority)
  ) {
    throw AppException.forbidden();
  }

  return true;
}

/**
 * 조직 역할 인가
 * @param property 페이로드 프로퍼티 이름
 * @param context 실행 컨텍스트
 * @param reflector 리플렉터
 * @param organizationService 조직 서비스
 * @returns 조직 역할 인가 여부
 */
async function validateOrganizationRoles(
  property: GuardProperty,
  context: ExecutionContext,
  reflector: Reflector,
  organizationService: OrganizationService,
): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const params = request.params;
  const payload: Payload = request[property];
  const requiredOrganizationRoles = reflector.getAllAndOverride<
    OrganizationRole[]
  >(ORGANIZATION_ROLES_KEY, [context.getHandler(), context.getClass()]);

  if (!requiredOrganizationRoles) {
    return true;
  }

  const userOrganization = await organizationService.getUserOrganization(
    payload.sub,
    params.organizationId,
  );

  if (!userOrganization) {
    throw AppException.organizationNotFound({
      organizationId: params.organizationId,
    });
  }

  if (
    requiredOrganizationRoles.some(
      (role) => userOrganization.organizationRole < role,
    )
  ) {
    throw AppException.organizationAccessDenied();
  }

  return true;
}

/**
 * 검증 토큰 인증 가드
 */
@Injectable()
export class JwtVerificationAuthGuard
  extends AuthGuard('jwt-verification')
  implements CanActivate
{
  constructor() {
    super({ property: GuardProperty.VERIFICATION });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // JWT 인증
    const isAuthenticated = (await super.canActivate(context)) as boolean;

    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const payload: Payload = request[GuardProperty.VERIFICATION];

    return (
      !payload.provider ||
      payload.provider === Provider.LOCAL ||
      Boolean(payload.providerId)
    );
  }
}

/**
 * 액세스 토큰 인증 가드
 */
@Injectable()
export class JwtAccessAuthGuard
  extends AuthGuard('jwt-access')
  implements CanActivate
{
  constructor(
    private reflector: Reflector,
    private adminAdminUsersService: AdminAdminUsersService,
    private organizationService: OrganizationService,
  ) {
    super({ property: GuardProperty.ACCESS });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // JWT 인증
    const isAuthenticated = (await super.canActivate(context)) as boolean;

    if (!isAuthenticated) {
      return false;
    }

    const adminAuthoritiesValidation = await validateAdminAuthorities(
      GuardProperty.ACCESS,
      context,
      this.reflector,
      this.adminAdminUsersService,
    );

    const organizationRolesValidation = await validateOrganizationRoles(
      GuardProperty.ACCESS,
      context,
      this.reflector,
      this.organizationService,
    );

    return adminAuthoritiesValidation && organizationRolesValidation;
  }
}

/**
 * 리프레시 토큰 인증 가드
 */
@Injectable()
export class JwtRefreshAuthGuard
  extends AuthGuard('jwt-refresh')
  implements CanActivate
{
  constructor(
    private reflector: Reflector,
    private adminAdminUsersService: AdminAdminUsersService,
  ) {
    super({ property: GuardProperty.REFRESH });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // JWT 인증
    const isAuthenticated = (await super.canActivate(context)) as boolean;

    if (!isAuthenticated) {
      return false;
    }

    const adminAuthoritiesValidation = await validateAdminAuthorities(
      GuardProperty.REFRESH,
      context,
      this.reflector,
      this.adminAdminUsersService,
    );

    return adminAuthoritiesValidation;
  }
}

@Injectable()
export class JwtHubAuthGuard extends AuthGuard('jwt-hub') {
  constructor() {
    super({ property: GuardProperty.HUB });
  }
}
