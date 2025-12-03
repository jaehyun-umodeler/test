import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { Campaign } from './entities/campaign.entity';
import { ResponseDto } from 'src/common/dto/response.dto';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { Request } from 'express';
import { ListQueryDto } from 'src/common/dto/list-query.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  findAll(@Query() query: ListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return this.campaignsService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ResponseDto<Campaign>> {
    return this.campaignsService.findOne(id);
  }

  @Post(':code/receive')
  @UseGuards(JwtAccessAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async receive(
    @Param('code') code: string,
    @Req() req: Request,
  ): Promise<void> {
    const accessPayload = req.accessPayload;
    await this.campaignsService.receive(code, accessPayload.sub);
  }
}
