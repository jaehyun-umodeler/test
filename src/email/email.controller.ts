import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ISendMailOptions } from '@nestjs-modules/mailer';

import { EmailService } from './email.service';
import { InquiryEmailDto } from './dtos/inquiry-email.dto';

/**
 * 이메일 컨트롤러
 */
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async sendEmail(@Body() data: ISendMailOptions) {
    await this.emailService.sendEmail(data);
  }

  @Post('inquiry')
  @UseInterceptors(FileInterceptor('attachment'))
  async sendInquiryEmail(
    @Body() data: InquiryEmailDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.emailService.sendInquiryEmail({
      ...data,
      attachment: file,
    });
  }
}
