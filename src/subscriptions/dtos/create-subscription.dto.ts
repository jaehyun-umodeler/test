import { IsEnum, IsDateString } from 'class-validator';
import { SubscriptionPlan } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;
}