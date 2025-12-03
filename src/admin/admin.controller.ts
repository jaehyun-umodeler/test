import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

import { AdminAdminUsersService } from './admin-users/admin.admin-users.service';
import { User } from '../users/entities/user.entity';
import { License } from '../licenses/entities/license.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Payment } from '../payments/entities/payment.entity';
import { AccountExt } from 'src/users/entities/accountExt.entity';
import { Cardentity } from '../users/entities/card.entity';
import { Subscribeentity } from '../subscriptions/entities/subscribe.entity';
import { LicenseGroup } from '../licenses/entities/license-group.entity';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { decryptEmail } from 'src/utils/util';
import { Coupongroup } from 'src/coupon/entities/coupongroup.entity';
import { Couponlist } from 'src/coupon/entities/couponlist.entity';
import { Connection } from 'typeorm';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { AdminAuthorities } from 'src/auth/decorators/admin-authority.decorator';
import { AdminAuthority } from 'src/utils/constants';

@Controller()
export class AdminController {
  constructor(
    private readonly adminAdminUsersService: AdminAdminUsersService,
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  @Get('me')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: Request) {
    const accessPayload = req.accessPayload;
    const admin = await this.adminAdminUsersService.findOneByUserId(
      accessPayload.sub,
    );

    return admin;
  }

  /* @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminAdminUsersService.create(createAdminDto);
  } */

  /* @Get()
  // @UseGuards(JwtAuthGuard) // JWT 인증된 관리자만 접근
  findAll() {
    return this.adminAdminUsersService.findAll();
  } */

  /* // GET /admin/list - Admin 항목 전체 조회
  @Get('list')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async getAdmin(): Promise<AdminDto[]> {
    const result = await this.adminAdminUsersService.findAll();
    console.log("result : ", result);
    return result;
  } */

  /* @Patch('list')
  // @UseGuards(JwtAuthGuard)
  async patchAdmin(@Body() admins: Admin[]): Promise<AdminDto[]> {
    const result = await this.adminAdminUsersService.updateAdminList(admins);
    console.log("result : ", result);
    return result;
  } */

  /* @Get(':id')
  // @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.adminAdminUsersService.findOne(+id);
  } */

  /* @Patch(':id')
  // @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminAdminUsersService.update(+id, updateAdminDto);
  } */

  /* @Delete(':id')
  // @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.adminAdminUsersService.remove(+id);
  } */

  /* @Post('save')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async saveAdmin(@Body() adminPayload: { data: Admin; password: string }): Promise<AdminDto> {
    return await this.adminAdminUsersService.save(adminPayload.data, adminPayload.password);
  } */
  @Post('subscribelist')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async subscribelist(@Body() data: {}) {
    const {} = data;
    const subscriptionlist = await this.subscriptionRepository.find({
      where: {},
      order: { id: 'DESC' },
      relations: ['user'],
    });
    let lists = subscriptionlist?.map((x, i) => {
      x.user.email = decryptEmail(x.user.email);
      return x;
    });

    const paylist = await this.subscribeentityRepository.find({
      where: {},
      order: { idx: 'DESC' },
    });
    const cardlist = await this.cardentityRepository.find({
      where: {},
      order: { idx: 'DESC' },
    });

    const trialQuery = `SELECT * FROM trial_data`;
    const trial = await this.connection.query(trialQuery);
    const trialLicenses: any[] = [];
    for (const item of trial) {
      const user = await this.userRepository.findOne({
        where: { id: item.user_uid },
      });
      if (!user) {
        continue;
      }
      user.email = decryptEmail(user.email);
      trialLicenses.push({
        id: item.seq,
        userId: item.user_uid,
        createdAt: item.created_at,
        revokedAt: null,
        licenseCode: item.plan,
        plan: item.plan,
        user: user,
        licenseGroup: {
          createdAt: item.created_at,
          expiredAt: item.expired_at,
          licenseCategory: 0,
          groupId: '',
          groupOwner: user,
          period: Math.floor(
            (new Date(item.expired_at).getTime() -
              new Date(item.created_at).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        },
      });
    }

    return {
      message: 'succ',
      success: true,
      status: 200,
      result: {
        subscriptionlist: lists,
        paylist: paylist,
        cardlist: cardlist,
        triallist: trialLicenses,
      },
    };
  }
  @Post('couponinsert')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async couponinsert(
    @Body()
    data: {
      targetType: any; // "전체", "개별"
      uniqueEmails: any;
      discount: any; // 할인율 (%)
      validity: any; // 유효기간 (day)
      prefix: any;
      memo: any;
    },
  ) {
    const moment = require('moment');
    const { targetType, uniqueEmails, discount, validity, prefix, memo } = data;
    //console.log(data);
    let emails = [];
    const userlist = await this.usersRepository.find({
      where: {
        validType: 'valid',
      },
    });
    //console.log(userlist);
    // const coupongroupck = await this.couponGroupRepository.findOne({
    //   where: {
    //     prefix: prefix
    //   },
    // });
    // if(coupongroupck){
    //   return { message: '이미 발급된 쿠폰코드 앞 3자리 입니다.', success: true, status: 400, result: null };
    // }
    const coupongroup = this.couponGroupRepository.create({
      targetType: targetType,
      discount: discount,
      validity: validity,
      prefix: prefix,
      memo: memo,
      validityDate: moment()
        .utcOffset('+09:00')
        .add(validity * 1, 'days')
        .format('YYYY-MM-DD HH:mm:ss'),
    });
    let subscriptionsave = await this.couponGroupRepository.save(coupongroup);
    //console.log(subscriptionsave);

    if (targetType === '전체') {
      userlist?.map(async (x, i) => {
        let code = Math.floor(10000000 + Math.random() * 90000000); // 10000000~99999999
        let emails = decryptEmail(x?.email);
        let couponCode = String(
          `${prefix}${subscriptionsave?.idx}${x?.id}${code}`,
        );
        couponCode = couponCode.substr(0, 16);
        let couponlistinsert = this.couponlistRepository.create({
          couponIdx: subscriptionsave?.idx,
          email: emails,
          prefix: prefix,
          couponCode: couponCode,
          status: 0,
          validityDate: subscriptionsave?.validityDate,
        });
        await this.couponlistRepository.save(couponlistinsert);
      });
    } else {
      // targetType : "개별"
      uniqueEmails?.map(async (x, i) => {
        let code = Math.floor(10000000 + Math.random() * 90000000); // 10000000~99999999
        let code2 = Math.floor(10000 + Math.random() * 90000); // 10000000~99999999
        let emails = x;
        let couponCode = String(
          `${prefix}${subscriptionsave?.idx}${code2}${code}`,
        );
        couponCode = couponCode.substr(0, 16);
        let couponlistinsert = this.couponlistRepository.create({
          couponIdx: subscriptionsave?.idx,
          email: emails,
          prefix: prefix,
          couponCode: couponCode,
          status: 0,
          validityDate: subscriptionsave?.validityDate,
        });
        await this.couponlistRepository.save(couponlistinsert);
      });
    }
    return {
      message: 'succ',
      success: true,
      status: 200,
      result: null,
    };
  }

  @Post('couponregisterinsert')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async couponregisterinsert(
    @Body()
    data: {
      discount: any;
      validity: any;
      autostatus: any;
      autosend_dt: any;
    },
  ) {
    const moment = require('moment');
    const { discount, validity, autostatus, autosend_dt } = data;

    const coupongroupck = await this.couponGroupRepository.findOne({
      where: {
        prefix: 'REG',
      },
    });
    if (coupongroupck) {
      await this.couponGroupRepository.update(
        {
          prefix: 'REG',
        },
        {
          discount: discount,
          validity: validity,
          validityDate: moment()
            .utcOffset('+09:00')
            .add(validity * 1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
          autosend_dt: moment(autosend_dt).format('YYYY-MM-DD HH:mm:ss'),
          autostatus: autostatus,
        },
      );
    } else {
      const coupongroup = this.couponGroupRepository.create({
        targetType: '가입',
        discount: discount,
        validity: validity,
        prefix: 'REG',
        validityDate: moment()
          .utcOffset('+09:00')
          .add(validity * 1, 'days')
          .format('YYYY-MM-DD HH:mm:ss'),
        autosend_dt: moment(autosend_dt).format('YYYY-MM-DD HH:mm:ss'),
        autostatus: autostatus,
      });
      await this.couponGroupRepository.save(coupongroup);
    }
    return {
      message: 'succ',
      success: true,
      status: 200,
      result: null,
    };
  }
  @Post('coupongroupinsert')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async coupongroupinsert(
    @Body() data: { discount: any; validity: any; prefix: any; memo: any },
  ) {
    const moment = require('moment');
    const { discount, validity, prefix, memo } = data;
    if (!discount) {
      return {
        message: '할인율을 입력해주세요.',
        success: true,
        status: 400,
        result: null,
      };
    }
    if (!validity) {
      return {
        message: '유효기간을 입력해주세요.',
        success: true,
        status: 400,
        result: null,
      };
    }
    if (!prefix) {
      return {
        message: '쿠폰코드를 입력해주세요.',
        success: true,
        status: 400,
        result: null,
      };
    }

    //console.log(userlist);
    const coupongroupck = await this.couponGroupRepository.findOne({
      where: {
        prefix: prefix,
      },
    });
    if (coupongroupck) {
      return {
        message: '이미 발급된 쿠폰코드 입니다.',
        success: true,
        status: 400,
        result: null,
      };
    }
    const coupongroup = this.couponGroupRepository.create({
      targetType: '발행',
      discount: discount,
      validity: validity,
      prefix: prefix,
      memo: memo,
      validityDate: moment()
        .utcOffset('+09:00')
        .add(validity * 1, 'days')
        .format('YYYY-MM-DD HH:mm:ss'),
    });
    let subscriptionsave = await this.couponGroupRepository.save(coupongroup);
    //console.log(subscriptionsave);
    return {
      message: 'succ',
      success: true,
      status: 200,
      result: null,
    };
  }

  @Post('couponlists')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async couponlists(@Body() data: {}) {
    const {} = data;
    const coupongrouplist = await this.couponGroupRepository.find({
      where: {},
      order: { idx: 'DESC' },
    });
    const couponsendlist = await this.couponlistRepository.find({
      where: {},
      order: { idx: 'DESC' },
    });

    return {
      message: 'succ',
      success: true,
      status: 200,
      result: {
        coupongrouplist: coupongrouplist,
        couponsendlist: couponsendlist,
      },
    };
  }

  @Post('paytotal')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async paytotal(@Body() data: {}) {
    const {} = data;
    //enum('Pro', 'Art Pass', 'All-In-One')
    const subscription = await this.subscriptionRepository.find({
      relations: ['user'],
    });

    return {
      message: 'succ',
      success: true,
      status: 200,
      result: {
        subscription: subscription,
      },
    };
  }
  @Post('paystatusUpdate')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async paystatusUpdate(@Body() data: { paystatus: number; ids: number[] }) {
    const { paystatus, ids } = data;
    //구독스케쥴 해지로 변경
    await this.licenseGroupRepository.update(
      {
        id: In(ids),
      },
      {
        paystatus: paystatus,
      },
    );

    return {
      message: 'succ',
      success: true,
      status: 200,
      result: null,
    };
  }
  @Post('expiredAtUpdate')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async expiredAtUpdate(@Body() data: { expiredAt: any; id: number }) {
    const { expiredAt, id } = data;
    const moment = require('moment');
    //구독스케쥴 해지로 변경
    let exDates =
      moment(expiredAt).format('YYYY-MM-DD') +
      ' ' +
      moment().format('HH:mm:ss');
    await this.licenseGroupRepository.update(
      {
        id: id,
      },
      {
        expiredAt: exDates,
      },
    );

    return {
      message: 'succ',
      success: true,
      status: 200,
      result: null,
    };
  }
  @Post('expiredAtBerkerUpdate')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async expiredAtBerkerUpdate(@Body() data: { expiredAt: any; ids: any }) {
    const { expiredAt, ids } = data;
    const moment = require('moment');
    //구독스케쥴 해지로 변경
    let exDates =
      moment(expiredAt).format('YYYY-MM-DD') +
      ' ' +
      moment().format('HH:mm:ss');
    await this.licenseGroupRepository.update(
      {
        id: In(ids),
      },
      {
        expiredAt: exDates,
      },
    );

    return {
      message: 'succ',
      success: true,
      status: 200,
      result: null,
    };
  }
}
