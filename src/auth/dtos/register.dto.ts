import { IsString, IsNumber, IsOptional } from 'class-validator';

/**
 * 회원 가입 요청 DTO
 */
export class RegisterDto {
  /** 비밀번호 */
  @IsString()
  password: string;

  /** 약관 동의 여부 */
  @IsNumber()
  isAcceptTermsOfService: number;

  /** 마케팅 활동 동의 여부 */
  @IsNumber()
  isAcceptMarketingActivities: number;

  /** 개인정보 수집 동의 여부 */
  @IsNumber()
  isAcceptPrivacyPolicy: number;

  @IsString()
  @IsOptional()
  campaignCode?: string;
}
