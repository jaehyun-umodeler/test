import { Injectable } from '@nestjs/common';
import { CreateResourceFileDto } from './dto/create-resource-file.dto';
import { UpdateResourceFileDto } from './dto/update-resource-file.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { ResourceFile } from './entities/resource-file.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AppException } from 'src/utils/app-exception';

@Injectable()
export class ResourceFilesService {
  constructor(
    @InjectRepository(ResourceFile)
    private readonly resourceFileRepository: Repository<ResourceFile>,
  ) {}

  create(createResourceFileDto: CreateResourceFileDto) {
    return 'This action adds a new resourceFile';
  }

  async findAll(isActive?: boolean): Promise<ResponseDto<ResourceFile[]>> {
    const where: FindOptionsWhere<ResourceFile> = {};
    if (isActive !== undefined) {
      where.valid = isActive ? 1 : 0;
    }
    const [resourceFiles, totalCount] =
      await this.resourceFileRepository.findAndCount({ where });
    return new ResponseDto(resourceFiles, totalCount);
  }

  async findOne(id: number): Promise<ResponseDto<ResourceFile>> {
    const resourceFile = await this.resourceFileRepository.findOne({
      where: { id },
    });
    if (!resourceFile) {
      throw AppException.notFound('Resource file not found');
    }
    return new ResponseDto<ResourceFile>(resourceFile, 1);
  }

  update(id: number, updateResourceFileDto: UpdateResourceFileDto) {
    return `This action updates a #${id} resourceFile`;
  }

  remove(id: number) {
    return `This action removes a #${id} resourceFile`;
  }
}
