import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';

import { MailchimpService } from './mailchimp.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';
import { normalizeLanguage } from 'src/utils/util';

/**
 * 메일침프 관련 API 컨트롤러
 * - 이메일 구독 등록, 해제
 * - 구독 상태 확인
 */
@Controller('mailchimp')
export class MailchimpController {
  constructor(private readonly mailchimpService: MailchimpService) {}

  /**
   * 메일침프에 이메일 구독 등록
   * @param subscribeDto 구독 정보
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @Body() subscribeDto: SubscribeDto,
    @I18nLang() language: string,
  ) {
    const member = await this.mailchimpService.updateMember(
      subscribeDto.email,
      {
        subscriptionStatus: true,
        language: normalizeLanguage(language),
      },
    );

    if (!member) {
      throw new InternalServerErrorException({
        errorCode: 'MAILCHIMP_SUBSCRIBE_FAILED',
      });
    }
  }

  /**
   * 메일침프에서 이메일 구독 해제
   * @param unsubscribeDto 구독 해제 정보
   */
  /* @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Body() unsubscribeDto: UnsubscribeDto) {
    const member = await this.mailchimpService.updateMember(unsubscribeDto.email, {
      subscriptionStatus: false,
    });

    if (!member) {
      throw new InternalServerErrorException({ errorCode: 'MAILCHIMP_UNSUBSCRIBE_FAILED' });
    }
  } */

  /**
   * 메일침프에서 이메일 구독 상태 확인
   * @param email 이메일 주소
   * @returns 구독 상태
   */
  /* @Get('status/:email')
  @HttpCode(HttpStatus.OK)
  async getStatus(@Param('email') email: string){
    const status = await this.mailchimpService.getMemberStatus(email);

    if (status === null) {
      throw new NotFoundException({ errorCode: 'EMAIL_NOT_FOUND' });
    }

    return status;
  } */
}
