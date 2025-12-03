import { ListQueryDto } from 'src/common/dto/list-query.dto';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { InvitationStatus } from 'src/utils/constants';

export class InvitationListQueryDto extends ListQueryDto {
  @IsEnum(InvitationStatus)
  @IsOptional()
  status?: InvitationStatus;

  @IsNumber()
  @IsOptional()
  teamId?: number;
}
