import { FolderType } from 'src/utils/constants';
import { IsEnum } from 'class-validator';

export class CreateFileDto {
  @IsEnum(FolderType)
  type: FolderType;
}
