import { IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from 'src/common/dto/list-query.dto';

export class AdminFindUsersDto extends ListQueryDto {
  @IsString()
  @IsOptional()
  validType?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  subscriptionStatus?: string;

  @IsString()
  @IsOptional()
  licenseType?: string;

  @IsString()
  @IsOptional()
  providerType?: string;

  @IsString()
  @IsOptional()
  planType?: string;
}
