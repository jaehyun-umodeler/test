import { join } from 'path';
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
  Delete,
  Param,
  Res,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { EtcService } from './etc.service';
import { Terms } from 'src/etc/entities/terms.entity';
import { Youtube } from 'src/etc/entities/youtube.entity';
import { Qna } from 'src/etc/entities/qna.entity';
import { Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { LicenseService } from 'src/licenses/licenses.service';
import { License } from 'src/licenses/entities/license.entity';
import { decryptEmail, encryptEmail } from 'src/utils/util';
import { readFileSync } from 'fs';
import { TeamService } from 'src/team/team.service';
import { InvitesService } from 'src/invites/invites.service';
import { CreateInviteDto } from 'src/invites/dtos/create-invite.dto';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { AdminAuthorities } from 'src/auth/decorators/admin-authority.decorator';
import { AdminAuthority } from 'src/utils/constants';
import { AuthService } from 'src/auth/services/auth.service';
import { ConfigService } from '@nestjs/config';
import { VerificationCodeService } from 'src/auth/services/verification-code.service';
import { EmailService } from 'src/email/email.service';
import { ResponseDto } from 'src/common/dto/response.dto';

@Controller('etc')
export class EtcController {
  constructor(
    private readonly etcService: EtcService,
    private readonly usersService: UsersService,
    private readonly licenseService: LicenseService,
    private readonly userService: UsersService,
    private readonly teamService: TeamService,
    private readonly inviteService: InvitesService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly verificationCodeService: VerificationCodeService,
  ) {}

  // 전체 약관을 한 번에 불러오기
  // GET /etc/terms
  @Get('term')
  async getTerms() {
    const terms = await this.etcService.getTerms();

    return new ResponseDto<Terms[]>(terms, terms.length);
  }

  // 선택된 탭(약관)과 언어에 해당하는 데이터만 저장(업데이트 또는 생성)
  // POST /etc/terms
  @Post('terms')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async saveTerm(
    @Body()
    data: {
      term: string;
      lang: string;
      subTitle: string;
      content: string;
    },
  ): Promise<Terms> {
    return this.etcService.saveTerm(data);
  }

  // GET /etc/qna - QNA 항목 전체 조회
  @Get('qna')
  async getQNA() {
    const qnas = await this.etcService.getQNA();

    return new ResponseDto<Qna[]>(qnas, qnas.length);
  }

  // PATCH /etc/qna - 전달받은 QNA 데이터를 전체 갱신
  @Patch('qna')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async patchQNA(@Body() data: Qna[]): Promise<Qna[]> {
    return this.etcService.patchQNA(data);
  }

  @Get('partnercode/:email/:code')
  async checkPartnerCode(
    @Param('email') email: string,
    @Param('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ msg: string; license?: License }> {
    const partnerEntries = await this.etcService.getPartner();

    const inputDomain = email.includes('@') ? email.split('@')[1] : email;
    const matchingPartners = partnerEntries.filter((entry) => {
      const entryDomain = entry.email.startsWith('@')
        ? entry.email.slice(1)
        : entry.email;
      return entryDomain === inputDomain;
    });
    console.log(partnerEntries);
    console.log(matchingPartners);

    if (Object.keys(matchingPartners).length > 0) {
      if (await this.authService.verifyCode(res, email, code)) {
        const user = await this.usersService.findByEmail(email);
        console.log('find user : ', user.id);
        if (user) {
          try {
            const edu = await this.licenseService.createEduLicense(
              user.id,
              new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000),
            );
            if (edu) {
              return { msg: 'success', license: edu };
            } else {
              return { msg: 'err3' };
            }
          } catch (error) {
            console.error('error : ', error);
            return { msg: 'err3' };
          }
        } else {
          return { msg: 'err2' };
        }
      } else {
        return { msg: 'err2' };
      }
    }

    return { msg: 'err1' };
  }

  // GET /etc/partner - Partner 항목 조회
  @Get('partner/:email/:language')
  async checkPartner(
    @Param('email') email: string,
    @Param('language') language: string,
  ): Promise<{ msg: string }> {
    console.log('checkPartner, email : ', email);
    const partnerEntries = await this.etcService.getPartner();

    const inputDomain = email.includes('@') ? email.split('@')[1] : email;

    const matchingPartners = partnerEntries.filter((entry) => {
      const entryDomain = entry.email.startsWith('@')
        ? entry.email.slice(1)
        : entry.email;
      return entryDomain === inputDomain;
    });

    console.log('matchingPartners : ', matchingPartners);
    if (Object.keys(matchingPartners).length > 0) {
      const user = await this.usersService.findByEmail(email);
      if (user) {
        console.log('find');
        await this.verificationCodeService.sendCode(
          email,
          language,
          true,
          true,
        );
        return { msg: 'success' };
      } else {
        console.log('not find, send');
        // const title = language === 'ko' ? 'Umodeler에 초대합니다!' : 'Invitation to Umodeler!';
        // const html = language === 'ko' ? '초대메일 한글' : 'Invitation email English';
        // await sendEmail(title, html, email);
        return { msg: 'err2' };
      }
    }

    return { msg: 'err1' };
  }

  // @Post('invite/:email/:language')
  // @UseGuards(JwtAccessAuthGuard)
  // async invite(
  //   @Param('email') email: string,
  //   @Param('language') language: string,
  //   @Body('from', ParseIntPipe) from: number,
  //   @Body('teamId', ParseIntPipe) teamId: number,
  // ): Promise<{ msg: string }> {
  //   console.log('invite, email : ', email);

  //   const invitedUser = await this.userService.findByEmail(email);
  //   console.log('invitedUser : ', invitedUser);
  //   if (!invitedUser) {
  //     const owner = await this.userService.findById(from);
  //     const accountExt = await this.userService.toUserDto(owner);
  //     const team = await this.teamService.getTeamById(teamId);
  //     const title =
  //       accountExt.emailLanguage === 'ko'
  //         ? '[UModeler X]조직에 참여하도록 초대되었습니다.'
  //         : '[UModeler X]You have been invited to join the organization.';
  //     const htmlFilePath = join(
  //       __dirname,
  //       '..',
  //       'assets',
  //       accountExt.emailLanguage === 'ko'
  //         ? 'html/org_join_ko.html'
  //         : 'html/org_join_en.html',
  //     );
  //     const inviterName =
  //       decryptEmail(owner.email) +
  //       (owner.fullname && owner.fullname.length > 0
  //         ? `(${owner.fullname})`
  //         : '');
  //     let htmlContent = readFileSync(htmlFilePath, 'utf8');
  //     htmlContent = htmlContent.replaceAll('*|MC:INVITER|*', inviterName);
  //     htmlContent = htmlContent.replaceAll('*|MC:TEAM|*', team.name);
  //     htmlContent = htmlContent.replaceAll(
  //       '*|MC:LINK|*',
  //       `${
  //         process.env.INVITE_MAIL_SERVER_ADDRESS ||
  //         this.configService.get('domain.frontend')
  //       }/Register`,
  //     );

  //     await sendEmail(title, htmlContent, email);

  //     const createInvite = new CreateInviteDto();
  //     createInvite.email = encryptEmail(email);
  //     createInvite.category = 1;
  //     createInvite.userId = from;
  //     createInvite.teamId = teamId;
  //     console.log('createInvite : ', createInvite);
  //     const result = await this.inviteService.create(createInvite);
  //     console.log('insert result : ', result);

  //     return { msg: 'success' };
  //   } else {
  //     return { msg: 'err1' };
  //   }
  // }

  // GET /etc/partner - Partner 항목 전체 조회
  @Get('partner')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async getPartner(): Promise<{ [key: string]: string }> {
    const partnerEntries = await this.etcService.getPartner();
    // Partner 배열을 { [name]: email } 형태의 객체로 변환
    return partnerEntries.reduce((acc, entry) => {
      acc[entry.name] = entry.email;
      return acc;
    }, {} as { [key: string]: string });
  }

  // PATCH /etc/partner - 전달받은 Partner 데이터를 전체 갱신
  @Patch('partner')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async patchPartner(
    @Body() data: { [key: string]: string },
  ): Promise<{ [key: string]: string }> {
    return this.etcService.patchPartner(data);
  }

  // GET /etc/youtube - 유튜브 링크 전체 조회
  @Get('youtube')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async youtubeList(): Promise<Youtube[]> {
    return this.etcService.getYoutube();
  }

  // PATCH /etc/youtube - 유튜브 링크 전체 갱신 (전체 업데이트)
  @Patch('youtube')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async patchYoutube(@Body() data: Youtube): Promise<Youtube> {
    return this.etcService.patchYoutube(data);
  }

  // DELETE /etc/youtube/:id - 특정 유튜브 링크 삭제 (옵션)
  @Delete('youtube/:id')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async deleteYoutube(@Param('id') id: string): Promise<void> {
    return this.etcService.deleteYoutube(Number(id));
  }

  /* @Post('sendemail')
  @UseInterceptors(FileInterceptor('attachment')) // 요청에서 파일 필드 이름은 "attachment"
  async sendEmailEndpoint(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    bodyDto: {
      title: string;
      body: string;
      receivers: string;
      sender?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ msg: string }> {
    try {
      console.log('sendmail, file : ', file);
      const success = await sendEmail(
        bodyDto.title,
        bodyDto.body,
        bodyDto.receivers,
        bodyDto.sender,
        file,
      );
      if (success) {
        return { msg: 'success' };
      } else {
        return { msg: 'fail' };
      }
    } catch (error) {
      console.error('Error in sendEmailEndpoint:', error);
      throw new HttpException(
        'Error sending email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  } */

  // POST /etc/send-mobile-download, 모바일 다운로드 가이드 이메일 발송
  @Post('send-mobile-download')
  async sendMobileDownloadEmail(
    @Body()
    bodyDto: {
      email: string; // 수신자 이메일
      language?: 'en' | 'ko'; // 언어
    },
  ): Promise<{ msg: string }> {
    try {
      await this.emailService.sendMobileDownload(
        bodyDto.email,
        bodyDto.language,
      );

      return { msg: 'success' };
    } catch (error) {
      console.error('Error in sendMobileDownloadEmail:', error);
      throw new HttpException(
        'Error sending email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
