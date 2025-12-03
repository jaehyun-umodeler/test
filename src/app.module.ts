import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import {
  AcceptLanguageResolver,
  I18nJsonLoader,
  I18nModule,
} from 'nestjs-i18n';
import { join } from 'path';
import { Repository } from 'typeorm';

import { AccountLinkModule } from './account-link/account-link.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BenefitsModule } from './benefits/benefits.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import appConfig from './configs/app.config';
import domainConfig from './configs/domain.config';
import emailConfig from './configs/email.config';
import gcpConfig from './configs/gcp.config';
import jwtConfig from './configs/jwt.config';
import mailchimpConfig from './configs/mailchimp.config';
import oauthConfig from './configs/oauth.config';
import typeormConfig from './configs/typeorm.config';
import { CouponModule } from './coupon/coupon.module';
import { EmailModule } from './email/email.module';
import { Terms } from './etc/entities/terms.entity';
import { EtcModule } from './etc/etc.module';
import { FilesModule } from './files/files.module';
import { HubModule } from './hub/hub.module';
import { InternalModule } from './internal/internal.module';
import { SlackModule } from './internal/slack/slack.module';
import { InvitationsModule } from './invitations/invitations.module';
import { LicensesModule } from './licenses/licenses.module';
import { MailchimpModule } from './mailchimp/mailchimp.module';
import { OrganizationModule } from './organization/organization.module';
import { PaymentsModule } from './payments/payments.module';
import { PlansModule } from './plans/plans.module';
import { PricesModule } from './prices/prices.module';
import { PricesService } from './prices/prices.service';
import { ResourceFilesModule } from './resource-files/resource-files.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TeamModule } from './team/team.module';
import { TutorialFilesModule } from './tutorial-files/tutorial-files.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [
        appConfig,
        domainConfig,
        jwtConfig,
        oauthConfig,
        emailConfig,
        mailchimpConfig,
        typeormConfig,
        gcpConfig,
      ],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        configService.get('typeorm'),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const emailConfig = configService.get('email');

        return {
          transport: {
            host: emailConfig.smtp.host,
            port: emailConfig.smtp.port,
            secure: emailConfig.smtp.secure,
            name: emailConfig.smtp.name,
            auth: emailConfig.smtp.user
              ? {
                  user: emailConfig.smtp.user,
                  pass: emailConfig.smtp.pass,
                }
              : undefined,
          },
          defaults: {
            from: emailConfig.defaultFrom,
          },
          template: {
            dir: join(__dirname, 'email', 'templates'),
            adapter: new EjsAdapter(),
          },
        };
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    TypeOrmModule.forFeature([Terms]),
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    PaymentsModule,
    LicensesModule,
    AdminModule,
    EtcModule,
    PricesModule,
    OrganizationModule,
    TeamModule,
    MailchimpModule,
    AccountLinkModule,
    InvitationsModule,
    EmailModule,
    FilesModule,
    TutorialFilesModule,
    HubModule,
    InternalModule,
    CampaignsModule,
    BenefitsModule,
    ResourceFilesModule,
    PlansModule,
    CouponModule,
    SlackModule,
  ],
  providers: [
    DatabaseService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    // private readonly adminUsersService: AdminUsersService,
    private readonly pricesService: PricesService,
    @InjectRepository(Terms)
    private readonly termsRepository: Repository<Terms>,
  ) {}

  async onModuleInit() {
    // await this.adminUsersService.createDefaultAdmin();
    await this.pricesService.createDefaultPrice();

    // ko와 en 버전의 약관 탭 이름 객체
    const tabs = {
      ko: [
        '이용약관',
        '개인정보 수집 및 이용 동의',
        '마케팅 정보 수신',
        '개인정보처리방침',
        'EULA',
        '쿠키정책',
        '회원탈퇴시 유의사항',
      ],
      en: [
        'Terms of Service',
        'Personal Information',
        'Marketing Information',
        'Privacy Policy',
        'EULA',
        'Cookie Policy',
        'Withdrawal Notice',
      ],
      title: [
        'Terms',
        'Collection',
        'Marketing',
        'Privacy',
        'EULA',
        'Cookies',
        'Withdraw',
      ],
    };

    const count = await this.termsRepository.count();
    if (count === 0) {
      const defaultTerms = [];
      const languages: ('ko' | 'en')[] = ['ko', 'en'];
      for (const lang of languages) {
        for (let i = 0; i < tabs.title.length; i++) {
          defaultTerms.push(
            this.termsRepository.create({
              term: tabs.title[i],
              lang,
              subTitle: lang === 'ko' ? tabs.ko[i] : tabs.en[i],
              content:
                lang === 'ko' ? `<p>${tabs.ko[i]}</p>` : `<p>${tabs.en[i]}</p>`,
            }),
          );
        }
      }
      await this.termsRepository.save(defaultTerms);
      console.log('기본 약관 데이터가 삽입되었습니다.');
    }
  }
}
