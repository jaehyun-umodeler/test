import { IsEmail, IsOptional, IsIn } from 'class-validator';

/**
 * 메일침프 구독 요청 DTO
 */
export class SubscribeDto {
  /** 이메일 주소 */
  @IsEmail()
  email: string;
}
