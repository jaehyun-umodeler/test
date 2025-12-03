import { ListQueryDto } from 'src/common/dto/list-query.dto';

export class MemberListQueryDto extends ListQueryDto {
  teamId?: number;
}
