import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ResponseDto } from 'src/common/dto/response.dto';
import { HubTutorialFileDto } from './dto/hub.tutorial-file.dto';
import { HubTutorialFilesService } from './hub.tutorial-files.service';
import { Request } from 'express';
import { HubController } from '../hub.controller';

@Controller('tutorial-files')
export class HubTutorialFilesController extends HubController {
  constructor(
    private readonly hubTutorialFilesService: HubTutorialFilesService,
  ) {
    super();
  }

  @Get()
  async findAll(
    @Req() req: Request,
  ): Promise<ResponseDto<HubTutorialFileDto[]>> {
    return this.hubTutorialFilesService.findAll(req.hubPayload.email);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ResponseDto<HubTutorialFileDto>> {
    return this.hubTutorialFilesService.findOne(id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async complete(@Param('id') id: string, @Req() req: Request): Promise<void> {
    await this.hubTutorialFilesService.complete(id, req.hubPayload.email);
  }
}
