import { IsEnum } from 'class-validator';
import { Provider } from 'src/auth/types/provider.type';

/**
 * 소셜 계정 해제 DTO
 */
export class UnlinkAccountLinkDto {
  @IsEnum(Provider)
  provider: Provider;
}
