import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { SubscriptionStatus } from 'src/utils/constants';

export class UpdateOrganizationSubscriptionDto {
  @IsNumber()
  @IsOptional()
  seatQuantity?: number;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;
}
