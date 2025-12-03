import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

import { AdminAuthorities } from '@/auth/decorators/admin-authority.decorator';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt.guard';
import { ListQueryDto } from '@/common/dto/list-query.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { CreateTutorialFileDto } from '@/tutorial-files/dto/create-tutorial-file.dto';
import { UpdateTutorialFileDto } from '@/tutorial-files/dto/update-tutorial-file.dto';
import { TutorialFile } from '@/tutorial-files/entities/tutorial-file.entity';
import { AdminAuthority } from '@/utils/constants';

import { AdminTutorialFilesService } from './admin.tutorial-files.service';
import { AdminTutorialFileDto } from './dto/admin.tutorial-file.dto';

@UseGuards(JwtAccessAuthGuard)
@Controller('tutorial-files')
export class AdminTutorialFilesController {
  constructor(
    private readonly adminTutorialFilesService: AdminTutorialFilesService,
  ) {}

  @AdminAuthorities(AdminAuthority.VIEWER)
  @UseInterceptors(FileInterceptor('file'))
  @Post()
  async create(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() createTutorialFileDto: CreateTutorialFileDto,
  ): Promise<TutorialFile> {
    const accessPayload = req.accessPayload;
    const userId = accessPayload.sub;
    return this.adminTutorialFilesService.create(
      userId,
      file,
      createTutorialFileDto,
    );
  }

  @Get()
  async findAll(
    @Query() query: ListQueryDto,
  ): Promise<ResponseDto<AdminTutorialFileDto[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return this.adminTutorialFilesService.findAll(page, limit);
  }

  @Patch(':id')
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.ACCEPTED)
  async update(
    @Param('id') id: string,
    @Body() updateTutorialFileDto: UpdateTutorialFileDto,
  ): Promise<void> {
    await this.adminTutorialFilesService.update(id, updateTutorialFileDto);
  }

  @Delete(':id')
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.adminTutorialFilesService.remove(id);
  }
}
