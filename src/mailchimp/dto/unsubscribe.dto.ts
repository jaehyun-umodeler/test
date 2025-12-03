import { IsEmail } from 'class-validator';

/**
 * 메일침프 구독 해제 요청 DTO
 */
export class UnsubscribeDto {
  /** 이메일 주소 */
  @IsEmail()
  email: string;
}
