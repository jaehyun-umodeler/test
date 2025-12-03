import {
  Controller,
  UseGuards,
  Req,
  Res,
  Body,
  Param,
  Get,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AccountLinkService } from 'src/account-link/account-link.service';
import { CookieService } from 'src/auth/services/cookie.service';
import { UnlinkAccountLinkDto } from 'src/account-link/dtos/account-link.dto';
import {
  JwtAccessAuthGuard,
  JwtVerificationAuthGuard,
} from 'src/auth/guards/jwt.guard';
import { Provider } from 'src/auth/types/provider.type';
import { AppException } from 'src/utils/app-exception';
import { ResponseDto } from 'src/common/dto/response.dto';
import { AccountLink } from './entities/accountLink.entity';

/**
 * 소셜 계정 연동 컨트롤러
 */
@Controller('account-link')
@UseGuards(JwtAccessAuthGuard)
export class AccountLinkController {
  constructor(
    private readonly accountLinkService: AccountLinkService,
    private readonly cookieService: CookieService,
  ) {}

  /**
   * 사용자의 모든 소셜 계정 조회
   * @param req 요청 객체
   * @returns 소셜 계정 목록
   */
  @Get()
  async getAccountLinks(@Req() req: Request) {
    const accessUser = req.user;
    const accountLinks = await this.accountLinkService.getAccountLinks(accessUser);

    return new ResponseDto<AccountLink[]>(accountLinks, accountLinks.length);
  }

  @Get(':provider')
  async getAccountLink(
    @Req() req: Request,
    @Param('provider') provider: Provider,
  ) {
    const accessPayload = req.accessPayload;

    return await this.accountLinkService.getAccountLink(
      accessPayload.sub,
      provider,
    );
  }

  /**
   * 소셜 계정 연동
   * @param req 요청 객체
   * @param res 응답 객체
   */
  @Post('link')
  @UseGuards(JwtVerificationAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async linkAccountLink(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.cookieService.clearVerificationTokenCookie(res);

    const accessPayload = req.accessPayload;
    const verificationPayload = req.verificationPayload;

    // 연동된 계정 조회
    const { sub } = accessPayload;
    const { provider, providerId, email } = verificationPayload;
    const accountLink =
      await this.accountLinkService.getAccountLinkByProviderId(
        provider,
        providerId,
      );

    if (accountLink) {
      throw AppException.conflict();
    }

    // 계정 연동
    await this.accountLinkService.linkAccount(sub, provider, providerId, email);
  }

  /**
   * 소셜 계정 해제
   * @param req 요청 객체
   * @param unlinkAccountLinkDto 해제 데이터 DTO
   */
  @Delete('unlink')
  @HttpCode(HttpStatus.OK)
  async unlinkAccountLink(
    @Req() req: Request,
    @Body() unlinkAccountLinkDto: UnlinkAccountLinkDto,
  ) {
    const accessPayload = req.accessPayload;

    await this.accountLinkService.unlinkAccount(
      accessPayload.sub,
      unlinkAccountLinkDto.provider,
    );

    return new ResponseDto<void>(null);
  }
}
