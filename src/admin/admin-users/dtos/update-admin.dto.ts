import { IsString, IsEnum, IsOptional } from 'class-validator';
import { AdminAuthority } from 'src/utils/constants';

/**
 * 관리자 정보 수정 요청 DTO
 */
export class UpdateAdminDto {
  /** 관리자 이름 */
  @IsOptional()
  @IsString()
  name?: string;

  /** 부서 */
  @IsOptional()
  @IsString()
  department?: string;

  /** 권한 레벨 */
  @IsOptional()
  @IsEnum(AdminAuthority)
  authority?: AdminAuthority;
}
