import { IsString, IsEmail, IsNumber, IsOptional } from 'class-validator';

export class CreateOrganizationDto {
  /** 조직 이름 */
  @IsString()
  name: string;

  /** 사용자 ID */
  @IsEmail()
  email: string;

  @IsString()
  planId: string;

  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @IsNumber()
  @IsOptional()
  seatQuantity?: number;
}
