import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BenefitsService } from './benefits.service';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { Request } from 'express';
import { FindBenefitDto } from './dto/find-benefit.dto';
import { ResponseDto } from 'src/common/dto/response.dto';

@Controller('benefits')
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get()
  @UseGuards(JwtAccessAuthGuard)
  async findAll(@Req() req: Request): Promise<ResponseDto<FindBenefitDto[]>> {
    const accessPayload = req.accessPayload;
    return this.benefitsService.findAllByUserId(accessPayload.sub);
  }

  @Get(':id/download')
  @UseGuards(JwtAccessAuthGuard)
  async getDownloadUrl(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ResponseDto<{ downloadUrl: string }>> {
    const accessPayload = req.accessPayload;
    const downloadUrl = await this.benefitsService.getDownloadUrl(
      accessPayload.sub,
      id,
    );
    return new ResponseDto<{ downloadUrl: string }>(
      { downloadUrl: downloadUrl },
      1,
    );
  }

  @Post(':id/use')
  @UseGuards(JwtAccessAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async use(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const accessPayload = req.accessPayload;
    await this.benefitsService.use(accessPayload.sub, id);
  }
}
