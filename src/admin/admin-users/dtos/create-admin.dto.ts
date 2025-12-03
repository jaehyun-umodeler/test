import { IsEmail, IsString, IsEnum } from 'class-validator';
import { AdminAuthority } from 'src/utils/constants';

/**
 * 관리자 생성 요청 DTO
 */
export class CreateAdminDto {
  /** 이메일 주소 */
  @IsEmail()
  email: string;

  /** 관리자 이름 */
  @IsString()
  name: string;

  /** 부서 */
  @IsString()
  department: string;

  /** 권한 레벨 */
  @IsEnum(AdminAuthority)
  authority: AdminAuthority;
}
