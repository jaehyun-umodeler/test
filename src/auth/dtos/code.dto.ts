import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

/**
 * 이메일 인증 코드 발송 요청 DTO
 */
export class CodeDto {
  /** 이메일 주소 */
  @IsEmail()
  email: string;

  /** 비밀번호 초기화 여부 */
  @IsOptional()
  @IsBoolean()
  resetPassword?: boolean;
}

/**
 * 이메일 인증 코드 검증 요청 DTO
 */
export class VerifyCodeDto {
  /** 이메일 주소 */
  @IsEmail()
  email: string;

  /** 인증 코드 */
  @IsString()
  code: string;
}
