import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService, ISendMailOptions } from '@nestjs-modules/mailer';
import { Attachment } from 'nodemailer/lib/mailer';
import { I18nService } from 'nestjs-i18n';

import { LicenseEmailType, LicenseEmailData } from './types/license-email.type';
import { InquiryEmailData } from './types/inquiry-email.type';
import { Invitation } from 'src/invitations/entities/invitation.entity';
import { decryptEmail, normalizeLanguage } from 'src/utils/util';
import { AppException } from 'src/utils/app-exception';
import { ErrorCode } from 'src/utils/error-codes';

/**
 * 이메일 서비스
 * - 이메일 발송
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly prefix = '[UModeler X]';

  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * 이메일 발송
   * @param sendMailOptions 이메일 발송 옵션
   */
  async sendEmail(sendMailOptions: ISendMailOptions) {
    try {
      sendMailOptions.subject = `${this.prefix} ${sendMailOptions.subject}`;

      await this.mailerService.sendMail(sendMailOptions);

      this.logger.log(
        `Email sent to ${sendMailOptions.to}: ${sendMailOptions.subject}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending email to ${sendMailOptions.to}: ${error}`,
      );

      throw new AppException(ErrorCode.EMAIL_SERVICE_ERROR);
    }
  }

  /**
   * Multer 파일 객체를 Mailer Attachment 객체로 변환
   * @param file Multer 파일 객체
   * @returns Mailer Attachment 객체
   */
  private convertMulterFileToAttachment(file: Express.Multer.File): Attachment {
    return {
      filename: file.originalname,
      content: file.buffer as Buffer,
      contentType: file.mimetype,
    };
  }

  /**
   * 인증 코드 발송
   * @param to 수신자 이메일
   * @param language 언어
   * @returns 인증 코드
   */
  async sendVerificationCode(to: string, language: string): Promise<string> {
    const key = 'email.verificationCode';
    const normalizedLang = normalizeLanguage(language);

    const subject = this.i18n.t(`${key}.subject`, {
      lang: normalizedLang,
    });
    const code = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const context: any = this.i18n.t(`${key}.context`, {
      lang: normalizedLang,
      args: {
        subject,
        code,
      },
    });
    const template = 'verification-code';

    await this.sendEmail({
      to,
      subject,
      context,
      template,
    });

    return code;
  }

  /**
   * 회원 가입 환영 이메일 발송
   * @param to 수신자 이메일
   * @param language 언어
   */
  async sendWelcomeEmail(to: string, language: string) {
    const key = 'email.welcome';
    const normalizedLang = normalizeLanguage(language);

    const subject = this.i18n.t(`${key}.subject`, {
      lang: normalizedLang,
    });
    const context: any = this.i18n.t(`${key}.context`, {
      lang: normalizedLang,
      args: {
        subject,
      },
    });
    const template = 'welcome';

    await this.sendEmail({
      to,
      subject,
      context,
      template,
    });
  }

  /**
   * 라이선스 이메일 발송
   * @param type 라이선스 이메일 타입
   * @param data 라이선스 이메일 데이터
   */
  async sendLicenseNotification(
    type: LicenseEmailType,
    data: LicenseEmailData,
  ) {
    const normalizedLang = normalizeLanguage(data.language);

    let key = `email.license.${type}`;
    let template = `license-${type}`;
    if (
      type === LicenseEmailType.ISSUED &&
      (data.licenseCategory === 0 || data.licenseCategory === 6)
    ) {
      template = `${template}-pro`;
      key = 'email.license.issuedPro';
    }

    const to = data.email;
    const subject = this.i18n.t(`${key}.subject`, {
      lang: normalizedLang,
    });
    const plan =
      data.licenseCategory === 0
        ? 'Pro'
        : data.licenseCategory === 1
        ? 'Art Pass'
        : data.licenseCategory === 2
        ? 'All-In-One'
        : data.licenseCategory === 5
        ? 'Enterprise'
        : data.licenseCategory === 6
        ? 'Pro Personal'
        : 'School';
    const context: any = this.i18n.t(`${key}.context`, {
      lang: normalizedLang,
      args: {
        subject,
        loginPage: `${this.configService.get('domain.frontend')}/login`,
        licensePage: `${this.configService.get(
          'domain.frontend',
        )}/license-management`,
        plan,
        userName: data.userName,
        ownerName: data?.ownerName,
      },
    });

    await this.sendEmail({
      to,
      subject,
      context,
      template,
    });
  }

  /**
   * 결제 실패 알림 이메일 발송
   * @param to 수신자 이메일
   */
  async sendPaymentFailedEmail(
    to: string,
    licenseCode: string,
    endDate: string,
    language: string,
  ) {
    const key = 'email.paymentFailed';
    const normalizedLang = normalizeLanguage(language);

    const subject = this.i18n.t(`${key}.subject`, {
      lang: normalizedLang,
    });
    const context: any = this.i18n.t(`${key}.context`, {
      lang: normalizedLang,
      args: {
        subject,
        link: this.configService.get('domain.frontend'),
        licenseCode,
        endDate,
      },
    });
    const template = 'pay-failed';

    await this.sendEmail({
      to,
      subject,
      context,
      template,
    });
  }

  /**
   * 조직 초대 이메일 발송
   * @param invitations 초대 데이터 목록
   */
  async sendOrganizationInvitationEmail(
    inviterEmail: string,
    organizationName: string,
    invitations: Invitation[],
    language: string,
  ) {
    const key = 'email.orgJoin';

    for (const invitation of invitations) {
      const normalizedLang = normalizeLanguage(language);

      const to = decryptEmail(invitation.email);
      const subject = this.i18n.t(`${key}.subject`, {
        lang: normalizedLang,
      });
      const context: any = this.i18n.t(`${key}.context`, {
        lang: normalizedLang,
        args: {
          subject,
          link: `${this.configService.get('domain.frontend')}/login`,
          inviter: inviterEmail,
          organization: organizationName,
        },
      });
      const template = 'org-join';

      await this.sendEmail({
        to,
        subject,
        context,
        template,
      });
    }
  }

  /**
   * 모바일 다운로드 이메일 발송
   * @param to 수신자 이메일
   * @param language 언어
   */
  async sendMobileDownload(to: string, language: string) {
    const key = 'email.mobileDownload';
    const normalizedLang = normalizeLanguage(language);

    const subject = this.i18n.t(`${key}.subject`, {
      lang: normalizedLang,
    });
    const context: any = this.i18n.t(`${key}.context`, {
      lang: normalizedLang,
      args: {
        subject,
      },
    });
    const template = 'mobile-download';

    await this.sendEmail({
      to,
      subject,
      context,
      template,
    });
  }

  /**
   * 문의 이메일 발송
   * @param inquiryEmailData 문의 이메일 데이터
   * @param language 언어
   */
  async sendInquiryEmail(
    inquiryEmailData: InquiryEmailData,
    language: string = 'ko',
  ) {
    const key = 'email.inquiry';
    const normalizedLang = normalizeLanguage(language);

    const to = inquiryEmailData.qna.map((item) => item.email);
    const subject = inquiryEmailData.qna.map((item) => item.name).join(', ');
    const context: any = this.i18n.t(`${key}.context`, {
      lang: normalizedLang,
      args: {
        subject,
        ...inquiryEmailData,
      },
    });
    const template = 'inquiry';
    const attachments = inquiryEmailData.attachment
      ? [this.convertMulterFileToAttachment(inquiryEmailData.attachment)]
      : undefined;

    await this.sendEmail({
      to,
      subject,
      context,
      template,
      attachments,
    });
  }
}
