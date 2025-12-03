import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminAuthorities } from '@/auth/decorators/admin-authority.decorator';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt.guard';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResourceFile } from '@/resource-files/entities/resource-file.entity';
import { ResourceFilesService } from '@/resource-files/resource-files.service';
import { AdminAuthority } from '@/utils/constants';

import { AdminFindResourceFilesDto } from './dto/admin.resource-files.dto';

@UseGuards(JwtAccessAuthGuard)
@Controller('resource-files')
export class AdminResourceFilesController {
  constructor(private readonly resourceFilesService: ResourceFilesService) {}

  @Get()
  @AdminAuthorities(AdminAuthority.VIEWER)
  async findAll(
    @Query() query: AdminFindResourceFilesDto,
  ): Promise<ResponseDto<ResourceFile[]>> {
    const { isActive } = query;
    return this.resourceFilesService.findAll(Boolean(isActive));
  }
}
