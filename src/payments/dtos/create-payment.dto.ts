import { IsNumber, IsEnum, IsDateString } from 'class-validator';
import { PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsDateString()
  paymentDate: Date;
}