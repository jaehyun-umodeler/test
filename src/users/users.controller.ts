// src/users/users.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { In, Repository } from 'typeorm';

import { AccountLinkService } from 'src/account-link/account-link.service';
import {
  JwtAccessAuthGuard,
  JwtVerificationAuthGuard,
} from 'src/auth/guards/jwt.guard';
import { AuthService } from 'src/auth/services/auth.service';
import { CookieService } from 'src/auth/services/cookie.service';
import { ResponseDto } from 'src/common/dto/response.dto';
import { CouponService } from 'src/coupon/coupon.service';
import { CouponDto } from 'src/coupon/dtos/coupon.dto';
import { Coupongroup } from 'src/coupon/entities/coupongroup.entity';
import { Couponlist } from 'src/coupon/entities/couponlist.entity';
import { EmailService } from 'src/email/email.service';
import { EtcService } from 'src/etc/etc.service';
import { MailchimpService } from 'src/mailchimp/mailchimp.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { AccountExt } from 'src/users/entities/accountExt.entity';
import { AppException } from 'src/utils/app-exception';
import { ErrorCode } from 'src/utils/error-codes';
import {
  decryptEmail,
  encryptPassword,
  validatePassword,
} from 'src/utils/util';

import { LicenseGroup } from '../licenses/entities/license-group.entity';
import { License } from '../licenses/entities/license.entity';
import { LicenseService } from '../licenses/licenses.service';
import { Payment } from '../payments/entities/payment.entity';
import { Subscribeentity } from '../subscriptions/entities/subscribe.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UserDto } from './dtos/users.dto';
import { Cardentity } from './entities/card.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly etcService: EtcService,
    private readonly licenseService: LicenseService,
    private readonly configService: ConfigService,
    private readonly mailchimpService: MailchimpService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(AccountExt)
    private accountExtRepository: Repository<AccountExt>,
    @InjectRepository(Cardentity)
    private cardentityRepository: Repository<Cardentity>,
    @InjectRepository(Subscribeentity)
    private subscribeentityRepository: Repository<Subscribeentity>,
    @InjectRepository(LicenseGroup)
    private licenseGroupRepository: Repository<LicenseGroup>,
    @InjectRepository(Coupongroup)
    private couponGroupRepository: Repository<Coupongroup>,
    @InjectRepository(Couponlist)
    private couponlistRepository: Repository<Couponlist>,
    private readonly accountLinkService: AccountLinkService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly cookieService: CookieService,
    private readonly couponService: CouponService,
  ) {}

  @Get('me')
  @UseGuards(JwtAccessAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: Request) {
    const user = req.user;

    if (!user) {
      AppException.userNotFound();
    }

    const result = await this.usersService.toUserDto(user);
    const accountLink = await this.accountLinkService.getAccountLinks(user);

    return {
      ...result,
      email: decryptEmail(result.email),
      hasPassword: user.password !== encryptPassword(''),
      hasAccountLink: accountLink.length > 0,
    };
  }

  // email 검색
  @Get('search/:email')
  @UseGuards(JwtAccessAuthGuard)
  async searchUser(@Param('email') email: string) {
    return this.usersService.searchInner(email, { validType: 'valid' });
  }

  // 회원 라이선스 조회
  @Get('license/:id')
  async getLicensesByUser(@Param('id') id: string) {
    return this.usersService.getLicensesByUserId(Number(id));
  }

  // 회원 결제 내역 조회
  /* @Get('payments/:id')
  async getPaymentsByUser(@Param('id') id: string) {
    return this.usersService.getPaymentsByUserId(Number(id));
  } */

  // 회원 쿠폰 내역 조회
  /* @Get('coupon/:id')
  async getCouponsByUser(@Param('id') id: string) {
    return this.usersService.getCouponsByUserId(Number(id));
  } */

  // f7c3bc1d808e04732adf679965ccc34ca7ae3441
  @Patch()
  @UseGuards(JwtAccessAuthGuard)
  async updateUser(
    @Req() req: Request,
    @Body()
    updateData: {
      id: string;
      type?: string;
      password?: string;
      now_password?: string;
      name?: string;
      isAcceptMarketingActivities?: number;
      language?: string;
    },
  ): Promise<any> {
    let isChanged = false;
    updateData.id = String(req.user.id);

    //throw new BadRequestException('Password is incorrect');
    if (updateData?.password && updateData?.now_password) {
      const encryptedPassword = encryptPassword(updateData.now_password);
      const userPassword = await this.usersService.findById(
        Number(updateData.id),
      );
      if (
        userPassword.password &&
        (!validatePassword(updateData?.password) ||
          userPassword.password !== encryptedPassword)
      ) {
        throw new BadRequestException('Password is incorrect');
      }

      await this.usersService.updatePassword(
        Number(updateData.id),
        updateData.password,
      );
      isChanged = true;
    }

    if (updateData?.name) {
      await this.usersRepository.update(Number(updateData.id), {
        fullname: updateData.name,
      });
      isChanged = true;
    }

    if (
      updateData?.isAcceptMarketingActivities * 1 === 0 ||
      updateData?.isAcceptMarketingActivities * 1 === 1
    ) {
      await this.usersRepository.update(Number(updateData.id), {
        isAcceptMarketingActivities: updateData.isAcceptMarketingActivities,
      });
      isChanged = true;
    }

    if (updateData?.language) {
      await this.usersService.updateLanguage(
        Number(updateData.id),
        updateData.language,
      );

      isChanged = true;
    }

    //13123131231
    // const user = await this.usersService.findById(idx);
    // let emails = decryptEmail(user?.email);
    //const moment = require("moment");

    const user = await this.usersService.findById(Number(updateData.id));
    const decryptedEmail = decryptEmail(user.email);

    await this.mailchimpService.updateMember(decryptedEmail, {
      subscriptionStatus:
        updateData.isAcceptMarketingActivities !== undefined
          ? Number(updateData.isAcceptMarketingActivities) === 1
          : undefined,
      language: updateData?.language,
    });

    user.email = decryptedEmail;
    const { password: removed, ...userWithoutPassword } = user;

    return this.usersService.toUserDto(userWithoutPassword);
  }

  /**
   * 비밀번호 초기화
   * @param req 요청 객체
   * @param resetPasswordDto 비밀번호 초기화 데이터
   * @param res 응답 객체
   * @returns 생성된 사용자 정보
   */
  @Post('reset-password')
  @UseGuards(JwtVerificationAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Req() req: Request,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.cookieService.clearVerificationTokenCookie(res);

    const verificationUser = req.user;

    // 사용자가 존재하지 않는 경우
    if (!verificationUser) {
      throw new NotFoundException({ errorCode: 'USER_NOT_FOUND' });
    }

    // 비밀번호 형식 검증
    if (!validatePassword(resetPasswordDto.password)) {
      throw new BadRequestException({ errorCode: 'INVALID_PASSWORD' });
    }

    await this.usersService.resetPassword(
      verificationUser.id,
      resetPasswordDto,
    );
  }

  @Delete()
  @UseGuards(JwtAccessAuthGuard)
  async deleteUser(@Req() req: Request) {
    const userId = req.user.id;
    const accountExt = await this.accountExtRepository.findOne({
      where: { accountDataId: userId },
    });
    const user = await this.usersService.findById(userId);

    user.validType = 'expired';
    user.googleId = null;
    await this.usersRepository.save(user);

    if (accountExt) {
      accountExt.leavedDate = new Date();
      await this.accountExtRepository.save(accountExt);
    } else {
      const newAccountExt = this.accountExtRepository.create({
        accountDataId: userId,
        leavedDate: new Date(),
        emailLanguage: user.language,
      });
      await this.accountExtRepository.save(newAccountExt);
    }
    //메일챔프 구독상태 변경
    const decryptedEmail = decryptEmail(user.email);

    await this.mailchimpService.updateMember(decryptedEmail, {
      subscriptionStatus: false,
      addDeletedTags: true,
    });

    // 사용자의 모든 연동된 계정 해제
    await this.accountLinkService.unlinkAllAccounts(userId);

    return { message: 'User deleted successfully' };
  }

  // 사용자 ID 기준 결제 내역 조회
  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return this.paymentRepository.find({ where: { user: { id: userId } } });
  }

  @Get('XsollaToken')
  @UseGuards(JwtAccessAuthGuard)
  async XsollaToken(@Req() req: Request) {
    const accessPayload = req.accessPayload;
    const userId = accessPayload.sub;
    const user = await this.usersService.findById(userId);
    let emails = decryptEmail(user?.email);

    let MERCHANT_ID = process.env.XSOLLA_MERCHANT_ID || 'your_merchant_id';
    let API_KEY = process.env.XSOLLA_API_KEY || 'your_api_key';
    let PROJECT_ID = Number(process.env.XSOLLA_PROJECT_ID || 0);

    const settings: any = {
      project_id: PROJECT_ID,
      ui: {
        mode: 'user_account',
      },
      redirect_policy: {
        manual_redirection_action: 'postmessage',
      },
      payment_method: 1380,
    };
    if (process.env.NODE_ENV !== 'production') {
      settings.mode = 'sandbox';
    }

    const resp = await fetch(
      `https://api.xsolla.com/merchant/v2/merchants/${MERCHANT_ID}/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Basic ' +
            Buffer.from(`${MERCHANT_ID}:${API_KEY}`).toString('base64'),
        },
        body: JSON.stringify({
          settings: settings,
          user: {
            id: { value: String(emails + user?.id) },
            name: { value: emails },
            email: { value: emails },
          },
        }),
      },
    );

    const response = (await resp.json()) as any;

    return new ResponseDto<string>(response?.token);
  }

  @Post('XsolaCardAdd')
  @UseGuards(JwtAccessAuthGuard)
  async XsolaCardAdd(
    @Body() data: { idx: any; cardName: any; carduserid: any },
  ) {
    const { idx, cardName, carduserid } = data;

    const user = await this.usersService.findById(idx);
    const card = await this.usersService.cardById(idx);

    if (!user) {
      return { message: '회원정보가 없습니다.', success: false, status: 400 };
    }
    if (card.length > 0) {
      return {
        message: '이미 등록된 카드가 있습니다.',
        success: false,
        status: 400,
      };
    }
    await this.cardentityRepository.save({
      accountId: idx,
      carduserid: carduserid,
      cardName: cardName,
      status: 0,
    });
    return {
      message: '결제 수단이 저장되었습니다.',
      success: true,
      status: 200,
    };
  }

  @Get('xsollaCardList')
  @UseGuards(JwtAccessAuthGuard)
  async XsollaApiCardlist(@Req() req: Request) {
    const accessPayload = req.accessPayload;
    const cards = await this.usersService.cardById(accessPayload.sub);

    return new ResponseDto<Cardentity[]>(cards);
  }

  @Post('XsolaCardDelete')
  @UseGuards(JwtAccessAuthGuard)
  async XsolaCardDelete(@Body() data: { idx: any }) {
    const { idx } = data;

    const card = await this.usersService.cardById(idx);
    const user = await this.usersService.findById(idx);

    if (!card) {
      return {
        message: '등록된 카드가 없습니다.',
        success: false,
        status: 400,
      };
    }
    let MERCHANT_ID =
      Number(process.env.XSOLLA_MERCHANT_ID) || 'your_merchant_id';
    let API_KEY = process.env.XSOLLA_API_KEY || 'your_api_key';
    let PROJECT_ID = Number(process.env.XSOLLA_PROJECT_ID || 0);
    let emails = decryptEmail(user?.email);

    let url = `https://api.xsolla.com/merchant/v2/projects/${PROJECT_ID}/users/${emails}${user?.id}/payment_accounts`;
    if (process.env.NODE_ENV !== 'production') {
      url += '?mode=sandbox';
    }
    const respcard = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' +
          Buffer.from(`${MERCHANT_ID}:${API_KEY}`).toString('base64'),
      },
    });
    const responsecard = (await respcard.json()) as any;

    //console.log(responsecard, responsecard?.length);

    if (responsecard?.length < 1) {
      return {
        message: '등록된 결제 수단이 없습니다.',
        success: false,
        result: null,
      };
    }
    for (let c = 0; c < responsecard?.length; c++) {
      let url = `https://api.xsolla.com/merchant/v2/projects/${PROJECT_ID}/users/${emails}${user?.id}/payment_accounts/card/${responsecard[c]?.id}`;
      if (process.env.NODE_ENV !== 'production') {
        url += '?mode=sandbox';
      }
      const delete_card = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Basic ' +
            Buffer.from(`${MERCHANT_ID}:${API_KEY}`).toString('base64'),
        },
      });
    }

    await this.cardentityRepository.delete({ accountId: idx });

    return {
      message: '삭제되었습니다.',
      success: true,
      status: 200,
      result: null,
    };
  }

  @Post('XsolaApipayMent')
  @UseGuards(JwtAccessAuthGuard)
  async XsolaApipayMent(
    @Body()
    data: {
      idx: any;
      cardIdx: any;
      priceMonth: any;
      priceDiscYear: any;
      priceOrigYear: any;
      planPopRadioValue: any;
      couponPrice: any;
      plan: any;
      invoice: any;
      couponCode: any;
      LicensesCounts: any;
    },
  ) {
    const moment = require('moment');
    const {
      idx,
      cardIdx,
      priceMonth,
      priceDiscYear, // 인보이스 할인 적용된 가격
      priceOrigYear, // 인보이스 할인 적용전 가격
      planPopRadioValue,
      couponPrice,
      plan,
      invoice,
      couponCode,
      LicensesCounts = 1,
    } = data;

    // invoice: false (not used)
    const invoiceCode = invoice ? invoice.invoice : false;
    if (invoiceCode) {
      const used = await this.usersService.isUsedInvoiceCode(invoiceCode);
      if (used)
        return {
          message: '이미 사용된 INVOICE 코드 입니다.',
          success: false,
          status: 400,
        };
    }

    // 가격 체크 (DB 값과 비교)
    await this.usersService.apiPayment(
      plan,
      priceMonth,
      priceDiscYear,
      priceOrigYear,
      invoice,
    );

    // 이름 변경 필요 (임시)
    const proMonth = priceMonth;
    const proYear = priceDiscYear;

    const cards = await this.usersService.cardById(idx);
    const user = await this.usersService.findById(idx);

    if (!user) {
      return { message: '회원정보가 없습니다.', success: false, status: 400 };
    }
    if (cards.length === 0) {
      return {
        message: '등록된 카드가 없습니다.',
        success: false,
        status: 400,
      };
    }
    const card = cards[0];
    console.log('[xsola api payment]:', data);

    if (couponCode != '') {
      const coupongroupfind = await this.couponGroupRepository.findOne({
        where: { prefix: couponCode },
      });
      if (coupongroupfind !== null) {
        let couponemails = decryptEmail(user?.email);
        const couponinserts = this.couponlistRepository.create({
          couponIdx: coupongroupfind?.idx,
          email: couponemails,
          prefix: couponCode?.substring(0, 3),
          couponCode: couponCode,
          status: 0,
          validityDate: moment(coupongroupfind?.validityDate).format(
            'YYYY-MM-DD HH:mm:ss',
          ),
          create_dt: moment(coupongroupfind?.create_dt).format(
            'YYYY-MM-DD HH:mm:ss',
          ),
        });
        let couponinsertssave =
          await this.couponlistRepository.save(couponinserts);
        // console.log("?????????????????????????????", {
        //   couponIdx: coupongroupfind?.idx,
        //   email: couponemails,
        //   prefix: couponCode?.substring(0, 3),
        //   couponCode: couponCode,
        //   status: 0,
        //   validityDate: moment(coupongroupfind?.validityDate).format('YYYY-MM-DD HH:mm:ss'),
        //   create_dt: moment(coupongroupfind?.create_dt).format('YYYY-MM-DD HH:mm:ss')
        // });
      }
    }
    //return { message: '쿠폰정보가 올바르지 않습니다.', success: false, status: 400 };
    const coupon = await this.couponlistRepository.findOne({
      where: { couponCode: couponCode },
    });
    console.log('[coupon]:', coupon, couponCode);
    const coupongroup = await this.couponGroupRepository.findOne({
      where: { idx: coupon?.couponIdx || -1 },
    });
    if (invoiceCode) {
      const subscriptionData = await this.subscriptionRepository.findOne({
        where: { invoiceCode: invoiceCode },
      });
      if (subscriptionData)
        return {
          message: '이미 사용된 INVOICE 코드 입니다.',
          success: false,
          status: 400,
        };
    }

    /*
    결제 api 추가
    */
    let MERCHANT_ID =
      Number(process.env.XSOLLA_MERCHANT_ID) || 'your_merchant_id';
    let API_KEY = process.env.XSOLLA_API_KEY || 'your_api_key';
    let PROJECT_ID = Number(process.env.XSOLLA_PROJECT_ID || 0);
    let emails = decryptEmail(user?.email);
    const currency = 'USD';

    let url = `https://api.xsolla.com/merchant/v2/projects/${PROJECT_ID}/users/${emails}${card?.accountId}/payment_accounts`;
    if (process.env.NODE_ENV !== 'production') {
      url += '?mode=sandbox';
    }
    const respcard = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' +
          Buffer.from(`${MERCHANT_ID}:${API_KEY}`).toString('base64'),
      },
    });
    try {
      const responsecard = (await respcard.json()) as any;
      //console.log(responsecard, responsecard?.length);
      if (responsecard?.length < 1) {
        return {
          message: '등록된 결제 수단이 없습니다.',
          success: false,
          result: null,
        };
      }

      let proYearprice = proYear;
      if (coupongroup !== null) {
        let discounts = Number(coupongroup?.discount) || 0;
        proYearprice = proYearprice - proYearprice * (discounts / 100);
      }

      const amount =
        planPopRadioValue * 1 === 1 ? proMonth : proYearprice * LicensesCounts;
      if (amount > 0) {
        const url = `https://api.xsolla.com/merchant/v2/projects/${PROJECT_ID}/users/${emails}${card?.accountId}/payments/card/${responsecard[0]?.id}`;
        const settings: any = {
          currency: currency,
          save: true,
        };
        if (process.env.NODE_ENV !== 'production') {
          settings.mode = 'sandbox';
        }
        const resp_payment = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Basic ' +
              Buffer.from(`${MERCHANT_ID}:${API_KEY}`).toString('base64'),
          },
          body: JSON.stringify({
            purchase: {
              description: {
                value: '구독 상품 선결제',
              },
              checkout: {
                currency: currency,
                // "amount": planPopRadioValue*1 === 1 ? proMonth : proYearprice*LicensesCounts
                amount: amount,
              },
            },
            settings: settings,
            user: {
              ip: '20.55.53.182',
              name: emails,
            },
          }),
        });

        const paymentresponse = (await resp_payment.json()) as any;
        console.log(paymentresponse);
        if (!paymentresponse?.transaction_id) {
          return {
            message: '결제에 실패하였습니다. 유효한 카드인지 확인해주세요.',
            success: false,
            tokens: null,
          };
        }
      }

      // nowMoment 에서 1개월(또는 1년) 뒤 날짜 계산
      // 년, 월, 일
      const nowMoment = moment(); // 결제 성공 일시 기준
      let ladd_y = nowMoment
        .clone()
        .add(1, planPopRadioValue * 1 === 1 ? 'months' : 'year')
        .format('YYYY'); //i 달 뒤 년
      let ladd_m = nowMoment
        .clone()
        .add(1, planPopRadioValue * 1 === 1 ? 'months' : 'year')
        .format('MM'); //i 달 뒤 월
      let ld = nowMoment.format('DD'); // 오늘 날짜의 일

      let ldateCker = moment(`${ladd_y}-${ladd_m}-${ld}`).isValid();
      let lpay_dt = null;
      if (!ldateCker) {
        lpay_dt = moment(`${ladd_y}-${ladd_m}`)
          .endOf('month')
          .format('YYYY-MM-DD');
      } else {
        lpay_dt = moment(`${ladd_y}-${ladd_m}-${ld}`).format('YYYY-MM-DD');
      }
      // 구독 만료일시
      lpay_dt =
        moment(lpay_dt).format('YYYY-MM-DD') +
        ' ' +
        nowMoment.format('HH:mm:ss');
      // 라이선스 그룹 생성일
      let createdAtset = nowMoment.format('YYYY-MM-DD HH:mm:ss');
      let licenseCategorys = 0;
      if (plan === 'Art Pass') {
        licenseCategorys = 1;
      } else if (plan === 'All-In-One') {
        licenseCategorys = 2;
      } else if (plan === 'Enterprise') {
        licenseCategorys = 5;
      } else if (plan === 'School' || plan === 'Edu') {
        licenseCategorys = 3;
      } else if (plan === 'Personal') {
        licenseCategorys = 6;
      } else {
        licenseCategorys = 0;
      }

      const groupOwnerId = user?.id;
      const totalLicenses = LicensesCounts;
      // 라이선스 그룹 생성일
      const createdAt = createdAtset;
      // 라이선스 그룹 만료일
      const expiredAt = lpay_dt;
      const licenseCategory = licenseCategorys;
      const etc = '';
      const email = emails;

      let licenceadd = await this.licenseService.createLicenseGroup(
        groupOwnerId,
        totalLicenses,
        createdAt,
        expiredAt,
        licenseCategory,
        etc,
        email,
      );
      // console.log("licenceadd", licenceadd, licenceadd?.groupId);

      // 구독료(정가)
      const oriPrice =
        planPopRadioValue * 1 === 1 ? proMonth : priceOrigYear * LicensesCounts;

      // subscription : subscription, subscribe_tb 생성
      // coupon : couponlist.status 변경 (0 -> 1)
      const subscription = this.subscriptionRepository.create({
        user,
        plan: plan,
        startDate: nowMoment.format('YYYY-MM-DD HH:mm:ss'),
        endDate: lpay_dt,
        oriEndDate: lpay_dt,
        ingstate: 1,
        pay_price: amount,
        ori_price: oriPrice,
        planYorM: planPopRadioValue,
        licenseCode: licenceadd?.groupId,
        showWon: currency,
        invoiceCode: invoiceCode ? invoiceCode : '',
      });
      let subscriptionsave =
        await this.subscriptionRepository.save(subscription);

      // 구독 결제 정보 생성
      await this.subscribeentityRepository.save({
        userIdx: user?.id,
        subscriptionId: subscriptionsave?.id,
        billkey: card?.carduserid,
        pay_dt: nowMoment.format('YYYY-MM-DD HH:mm:ss'),
        update_dt: nowMoment.format('YYYY-MM-DD HH:mm:ss'),
        pay_price: amount,
        ingstate: 1,
        cardName: card?.cardName,
      });

      // 월결제시 12개월 미리 생성
      // 연결제시 4년만 미리 생성
      // Table Column Type: timestamp >> Year 2038 problem
      let d = nowMoment.format('DD');
      const loopCount = planPopRadioValue * 1 === 1 ? 13 : 5;
      for (let i = 1; i < loopCount; i++) {
        let add_y = nowMoment
          .clone()
          .add(i, planPopRadioValue * 1 === 1 ? 'months' : 'year')
          .format('YYYY'); //i 달 뒤 년
        let add_m = nowMoment
          .clone()
          .add(i, planPopRadioValue * 1 === 1 ? 'months' : 'year')
          .format('MM'); //i 달 뒤 월
        let add_d = nowMoment
          .clone()
          .add(i, planPopRadioValue * 1 === 1 ? 'months' : 'year')
          .format('DD'); //i 달 뒤 일
        // let add_y = nowMoment.clone().add(i*3, 'm').format('YYYY'); //i 달 뒤 년
        // let add_m = nowMoment.clone().add(i*3, 'm').format('MM'); //i 달 뒤 월
        // let add_d = nowMoment.clone().add(i*3, 'm').format('DD'); //i 달 뒤 일
        // let add_hh = nowMoment.clone().add(i*3, 'm').format('HH'); //i 달 뒤 일
        // let add_mm = nowMoment.clone().add(i*3, 'm').format('mm'); //i 달 뒤 일

        let dateCker = moment(`${add_y}-${add_m}-${d}`).isValid();
        let pay_dt = null;
        if (!dateCker) {
          pay_dt = moment(`${add_y}-${add_m}`)
            .endOf('month')
            .format('YYYY-MM-DD');
        } else {
          pay_dt = moment(`${add_y}-${add_m}-${d}`).format('YYYY-MM-DD');
        }

        await this.subscribeentityRepository.save({
          userIdx: user?.id,
          billkey: card?.carduserid,
          pay_dt: `${pay_dt} ${nowMoment.format('HH:mm:ss')}`,
          // pay_dt: `${pay_dt} ${add_hh}:${add_mm}:00`,
          // pay_price: planPopRadioValue*1 === 1 ? proMonth : proYear*totalLicenses,
          pay_price: oriPrice,
          ingstate: 0,
          subscriptionId: subscriptionsave?.id,
          cardName: card?.cardName,
        });
      }

      await this.couponlistRepository.update(
        {
          idx: coupon?.idx,
        },
        {
          status: 1,
        },
      );

      await this.usersService.addSubscriptionExt(
        subscriptionsave?.id,
        couponCode,
        coupongroup,
        plan,
        invoice,
      );
      // await this.usersService.delInvoiceCode(invoiceCode);

      return {
        message: '구독이 시작되었습니다.',
        success: true,
        status: 200,
        result: null,
      };
    } catch (error) {
      return {
        message: '오류가 발생했습니다. 관리자에게 문의해주세요.',
        success: false,
        status: 400,
      };
    }
  }

  @Post('XsolaApipayMentlist')
  @UseGuards(JwtAccessAuthGuard)
  async XsolaApipayMentlist(
    @Body()
    data: {
      idx: any;
    },
  ) {
    const { idx } = data;

    const user = await this.usersService.findById(idx);

    if (!user) {
      return { message: '회원정보가 없습니다.', success: false, status: 400 };
    }

    const lists = await this.subscriptionsService.getSubscriptionsByUserId(idx);
    console.log('???', lists);

    return { message: 'succ', success: true, status: 200, result: lists };
  }

  @Post('XsolaAddchecking')
  @UseGuards(JwtAccessAuthGuard)
  async XsolaAddchecking(@Body() data: { idx: any }) {
    const { idx } = data;

    const user = await this.usersService.findById(idx);

    if (!user) {
      return { message: '회원정보가 없습니다.', success: false, status: 400 };
    }
    let MERCHANT_ID =
      Number(process.env.XSOLLA_MERCHANT_ID) || 'your_merchant_id';
    let API_KEY = process.env.XSOLLA_API_KEY || 'your_api_key';
    let PROJECT_ID = Number(process.env.XSOLLA_PROJECT_ID || 0);
    let emails = decryptEmail(user?.email);
    let url = `https://api.xsolla.com/merchant/v2/projects/${PROJECT_ID}/users/${emails}${user?.id}/payment_accounts`;
    if (process.env.NODE_ENV !== 'production') {
      url += '?mode=sandbox';
    }
    const respcard = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' +
          Buffer.from(`${MERCHANT_ID}:${API_KEY}`).toString('base64'),
      },
    });
    const responsecard = (await respcard.json()) as any;
    if (responsecard?.length > 0) {
      return {
        message: 'succ.',
        success: true,
        status: 200,
        result: responsecard[0],
      };
    } else {
      return { message: 'ing', success: true, status: 300, result: 'stay' };
    }
  }

  @Post('subscribepaylist')
  @UseGuards(JwtAccessAuthGuard)
  async subscribelist(@Body() data: { idx: any }) {
    const { idx } = data;

    const user = await this.usersService.findById(idx);

    if (!user) {
      return { message: '회원정보가 없습니다.', success: false, status: 400 };
    }

    const paylist = await this.subscribeentityRepository.find({
      where: {
        ingstate: In([0, 1, 2]),
        userIdx: user?.id,
      },
      order: { idx: 'DESC' },
    });
    const lists = await this.subscriptionsService.getSubscriptionsByUserId(idx);

    return {
      message: 'succ',
      success: true,
      status: 200,
      result: { paylist: paylist, lists: lists },
    };
  }

  @Post('subscribecancle')
  @UseGuards(JwtAccessAuthGuard)
  async subscribecancle(@Body() data: { id: any }) {
    const { id } = data;
    const moment = require('moment');
    const subscribe = await this.subscriptionsService.getSubscriptionById(id);
    console.log('?????????', subscribe);

    if (!subscribe) {
      return { message: '구독 정보가 없습니다.', success: false, status: 400 };
    }
    //구독테이블 해지신청으로 변경
    //let endDates = moment().add(3, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    // let endDates = moment().add(1, 'month').format('YYYY-MM-DD HH:mm:ss');
    // await this.subscriptionRepository.update({
    //   id: id
    // }, {
    //   ingstate: 5,
    //   endDate: endDates
    // });
    await this.subscriptionRepository.update(
      {
        id: id,
        ingstate: 1,
      },
      {
        ingstate: 5,
        endorderDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      },
    );

    //구독스케쥴 해지로 변경
    await this.subscribeentityRepository.update(
      {
        subscriptionId: id,
        ingstate: 0,
      },
      {
        ingstate: 3,
      },
    );

    //라이런스그룹 만료일 변경
    // await this.licenseGroupRepository.update({
    //   groupId: subscribe[0]?.licenseCode,
    // }, {
    //   expiredAt: endDates
    // });

    return { message: 'succ', success: true, status: 200, result: null };
  }

  @Post('subscribecancleback')
  @UseGuards(JwtAccessAuthGuard)
  async subscribecancleback(@Body() data: { id: any }) {
    const { id } = data;
    const subscribe = await this.subscriptionsService.getSubscriptionById(id);
    if (!subscribe) {
      return { message: '구독 정보가 없습니다.', success: false, status: 400 };
    }
    //구독테이블 해지신청에서 구독중으로 복구
    await this.subscriptionRepository.update(
      {
        id: id,
        ingstate: 5,
      },
      {
        ingstate: 1,
        endorderDate: null,
      },
    );

    //구독스케쥴 해지에서 예정으로 복구
    await this.subscribeentityRepository.update(
      {
        subscriptionId: id,
        ingstate: 3,
      },
      {
        ingstate: 0,
      },
    );

    return { message: 'succ', success: true, status: 200, result: null };
  }

  @Post('invoiceCker')
  async invoiceCker(@Body() data: { invoiceCode: any }) {
    const { invoiceCode } = data;
    return await this.usersService.invoiceCker(invoiceCode);
  }

  @Post('payfailSender')
  async payfailSender(
    @Body() body: { id: string; codes: string; enddate: string },
  ): Promise<UserDto> {
    const user = await this.usersService.findById(Number(body.id));

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    this.emailService.sendPaymentFailedEmail(
      decryptEmail(user.email),
      body.codes,
      body.enddate,
      user.language,
    );

    return await this.usersService.toUserDto(user);
  }

  @Get('coupon/:id')
  @UseGuards(JwtAccessAuthGuard)
  async getCoupons(
    @Req() req: Request,
    @Param('id') id: number,
  ): Promise<ResponseDto<CouponDto[]>> {
    const user = req.user;

    if (!user) {
      AppException.userNotFound();
    }
    if (user.id !== id) {
      AppException.forbidden();
    }

    const coupons = await this.couponService.getCoupons(user);

    return new ResponseDto<CouponDto[]>(coupons);
  }
}
