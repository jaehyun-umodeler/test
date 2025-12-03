import { IsString } from 'class-validator';

/**
 * 비밀번호 초기화 요청 DTO
 */
export class ResetPasswordDto {
  /** 비밀번호 */
  @IsString()
  password: string;
}
