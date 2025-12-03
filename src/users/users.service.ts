import { decryptEmail, encryptPassword, encryptEmail } from 'src/utils/util';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository, DataSource, IsNull, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Payment } from '../payments/entities/payment.entity';
import { AccountExt } from 'src/users/entities/accountExt.entity';
import { UserDto } from './dtos/users.dto';
import { LicenseService } from 'src/licenses/licenses.service';
import { LicenseDto } from 'src/licenses/dtos/license.dto';
import { Team } from 'src/team/entities/team.entity';
import { Cardentity } from './entities/card.entity';
import { Price } from 'src/prices/entities/prices.entity';
import {
  PLAN_ENUM,
  PKG_ENUM,
  DR_ENUM,
  InvitationStatus,
} from 'src/utils/constants';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ConfigService } from '@nestjs/config';
import { MailchimpService } from 'src/mailchimp/mailchimp.service';
import { UserOrganization } from 'src/organization/entities/user-organization.entity';
import { Invitation } from 'src/invitations/entities/invitation.entity';
import { AppException } from 'src/utils/app-exception';
import { normalizeLanguage } from 'src/utils/util';

@Injectable()
export class UsersService {
  private readonly jwtConfig = this.configService.get('jwt');

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(AccountExt)
    private accountExtRepository: Repository<AccountExt>,
    @Inject(forwardRef(() => LicenseService))
    private readonly licenseService: LicenseService,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(UserOrganization)
    private userOrganizationRepository: Repository<UserOrganization>,
    @InjectRepository(Cardentity)
    private cardentityRepository: Repository<Cardentity>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly mailchimpService: MailchimpService,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
  ) {
    this.jwtConfig = this.configService.get('jwt');
  }

  async toUserDto(user: User): Promise<UserDto> {
    const userOrganization = await this.userOrganizationRepository.findOne({
      where: { userId: user.id, isDefault: 1 },
      relations: ['organization'],
    });
    const invitation = await this.invitationRepository.findOne({
      where: {
        email: user.email,
        status: InvitationStatus.PENDING,
        deletedAt: IsNull(),
      },
    });
    return new UserDto(
      user,
      userOrganization?.organization,
      userOrganization?.organizationRole,
      invitation?.invitationToken,
    );
  }

  async create(data: Partial<User>): Promise<UserDto> {
    const invited = await this.usersRepository.findOne({
      where: { email: encryptEmail(data.email) },
    });

    if (invited) {
      data.id = invited.id;
      data.validType = 'valid';
    } else {
      data.validType = data.validType ? data.validType : 'valid';
    }
    let emails = data.email;
    data.username = data.username || '';
    data.fullname = data.fullname || '';
    data.countryCode = data.countryCode || '';
    data.language = data.language || '';
    data.isAcceptMarketingActivities =
      data.isAcceptMarketingActivities * 1 || 0;
    data.isAcceptPrivacyPolicy = 1;
    data.isAcceptTermsOfService = 1;
    data.email = encryptEmail(data.email);
    data.password = encryptPassword(data.password);

    let savedUser = undefined;
    if (invited) {
      savedUser = await this.usersRepository.save(data);
    } else {
      const user = this.usersRepository.create(data);
      savedUser = await this.usersRepository.save(user);

      const accountExt = new AccountExt();
      accountExt.user = savedUser;
      accountExt.accountDataId = savedUser.id;
      accountExt.emailLanguage = 'en';
      accountExt.leavedDate = null;
      await this.accountExtRepository.save(accountExt);
    }

    //메일챔프 구독상태 변경
    await this.mailchimpService.updateMember(emails, {
      subscriptionStatus: Number(data.isAcceptMarketingActivities) === 1,
    });

    return this.toUserDto(savedUser);
  }

  async login(user: User): Promise<UserDto> {
    const { password: removed, ...userWithoutPassword } = user;
    return this.toUserDto({ ...userWithoutPassword, email: user.email });
  }

  async findByEmail(email: string): Promise<User> {
    const encryptedEmail = encryptEmail(email);
    const user = await this.usersRepository.findOne({
      where: { email: encryptedEmail },
      order: { id: 'DESC' },
    });
    return user;
  }

  async findByEmailEncrypted(encryptedEmail: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email: encryptedEmail } });
  }

  async findByEmailLike(email: string): Promise<User[]> {
    const encryptedEmail = encryptEmail(email);
    const users = await this.usersRepository.find({
      where: { email: encryptedEmail },
    });
    return users;
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    return user;
  }

  /**
   * 비밀번호 초기화
   * @param userId 사용자 ID
   * @param resetPasswordDto 비밀번호 초기화 데이터
   * @returns 업데이트된 사용자 정보
   */
  async resetPassword(
    userId: number,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<User> {
    // 비밀번호 업데이트
    await this.updatePassword(userId, resetPasswordDto.password);

    return await this.findById(userId);
  }

  async updatePassword(id: number, newPassword: string): Promise<UserDto> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const encryptedPassword = encryptPassword(newPassword);
    user.password = encryptedPassword;
    this.usersRepository.save(user);

    return this.toUserDto(user);
  }

  /**
   * 사용자 언어 설정 업데이트
   * @param userId 사용자 ID
   * @param language 언어 코드
   * @returns 업데이트된 사용자 정보
   */
  async updateLanguage(userId: number, language: string): Promise<User> {
    const user = await this.findById(userId);
    const normalizedLanguage = normalizeLanguage(language);

    if (!user) {
      throw AppException.userNotFound();
    }

    // 사용자 언어 업데이트
    if (user.language !== normalizedLanguage) {
      await this.usersRepository.update(userId, {
        language: normalizedLanguage,
      });
    }

    // Mailchimp 업데이트
    const decryptedEmail = decryptEmail(user.email);

    await this.mailchimpService.updateMember(decryptedEmail, {
      language: normalizedLanguage,
    });

    return await this.findById(userId);
  }

  async deleteUser(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async getMembersByLeaveStatus(
    isLeaved: boolean,
    filters: any,
  ): Promise<any[]> {
    // AccountExt 엔티티를 import했다고 가정합니다.
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndMapOne(
        'user.accountExt',
        AccountExt,
        'accountExt',
        'accountExt.accountDataId = user.id',
      )
      .leftJoinAndMapOne(
        'user.subscribe',
        Subscription,
        'subscribe',
        'subscribe.userId = user.id',
      )
      .leftJoinAndSelect('user.licenses', 'license')
      .leftJoinAndSelect('license.licenseGroup', 'licenseGroup');

    if (isLeaved) {
      qb.andWhere('(user.validType = "expired")');
    } else {
      qb.andWhere('(user.validType != "expired")');
    }

    if (filters.startDate) {
      qb.andWhere('user.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      qb.andWhere('user.createdAt <= :endDate', {
        endDate: endDate.toISOString(),
      });
    }

    if (filters.subscriptionStatus && filters.subscriptionStatus !== '전체') {
      const isActive = filters.subscriptionStatus === '구독 중';
      const isPayfail = filters.subscriptionStatus === '결제 실패';
      const iscancleOrder = filters.subscriptionStatus === '해지 신청';
      const iscancleSucc = filters.subscriptionStatus === '해지 완료';
      const isExpired = filters.subscriptionStatus === '만료';
      const isNone = filters.subscriptionStatus === '구독 안함';

      if (isActive) {
        qb.andWhere(
          `(
          SELECT s.ingstate
          FROM subscription s
          WHERE s.userId = user.id and ingstate='1'
          LIMIT 1
        ) = :activeIngstate`,
          { activeIngstate: 1 },
        );
      }
      if (isPayfail) {
        qb.andWhere(
          `( SELECT s.ingstate FROM subscription s WHERE s.userId = user.id and ingstate='2' LIMIT 1 ) = :activeIngstate`,
          { activeIngstate: 2 },
        );
      }
      if (iscancleOrder) {
        qb.andWhere(
          `( SELECT s.ingstate FROM subscription s WHERE s.userId = user.id and ingstate='5' LIMIT 1 ) = :activeIngstate`,
          { activeIngstate: 5 },
        );
      }
      if (iscancleSucc) {
        qb.andWhere(
          `( SELECT s.ingstate FROM subscription s WHERE s.userId = user.id and ingstate='3' LIMIT 1 ) = :activeIngstate`,
          { activeIngstate: 3 },
        );
      }
      if (isExpired) {
        qb.andWhere(
          `(
          SELECT s.ingstate
          FROM subscription s
          WHERE s.userId = user.id
          LIMIT 1
        ) IN (:...expiredStates)`,
          { expiredStates: 4 },
        );
      }
      if (isNone) {
        qb.andWhere(`(
          SELECT s.ingstate
          FROM subscription s
          WHERE s.userId = user.id
          LIMIT 1
        ) IS NULL`);
      }
    }

    const productNumber = (subscriptionProduct) => {
      switch (subscriptionProduct) {
        case 'Pro':
          return 0;
        case 'Art Pass':
          return 1;
        case 'All-In-One':
          return 2;
        case 'School':
          return 3;
        case 'Enterprise':
          return 5;
        case 'Free':
          return 4;
        case 'Personal':
          return 6;
      }
      return undefined;
    };
    // if (filters.subscriptionProduct) {
    //   const subscriptionProduct = productNumber(filters.subscriptionProduct);
    //   if (subscriptionProduct || subscriptionProduct === 0) {
    //     qb.innerJoin('user.licenses', 'filterLicense')
    //       .innerJoin('filterLicense.licenseGroup', 'filterLicenseGroup')
    //       .andWhere('filterLicenseGroup.licenseCategory = :subscriptionProduct', { subscriptionProduct });
    //   }
    // }

    const trials = await this.dataSource
      .createQueryBuilder()
      .select('*')
      .from('trial_data', 't')
      .getRawMany();
    const trialsMap = new Map();
    const trialslist = await Promise.all(
      trials.map((v) => {
        trialsMap.set(v?.user_uid, v);
        return v;
      }),
    );

    const users = await qb.getMany();
    const users1 = await Promise.all(
      users.map(async (user) => {
        const products = new Set();
        // if(user?.id*1 === 14736){
        //   console.log(user);
        // }
        let usersid = user?.id;

        if (user.licenses) {
          user.licenses.forEach((license) => {
            const category = license.licenseGroup?.licenseCategory;
            switch (category) {
              case 0:
                products.add('Pro');
                break;
              case 1:
                products.add('Art Pass');
                break;
              case 2:
                products.add('All-In-One');
                break;
              case 3:
                products.add('School');
                break;
              case 5:
                products.add('Enterprise');
                break;
              case 4:
                products.add('Free');
                break;
              case 6:
                products.add('Personal');
                break;
              default:
                break;
            }
          });
        }
        let trialscker = trialsMap.get(usersid) || {};
        if (trialscker) {
          //console.log("???????????///", trials, user?.id);
          products.add('Trial');
        }
        //console.log(products);
        const subscriptionProduct = Array.from(products).join(', ');
        return { ...user, subscriptionProduct };
      }),
    );

    let members = await Promise.all(
      users1.map(async (user) => {
        let subscriptionStatus = '';
        const subscription = (user as any).subscribe;
        const accountExts = (user as any).accountExt;
        //console.log(accountExts);
        if (subscription) {
          subscriptionStatus = subscription.ingstate;
        }

        return {
          id: user.id,
          joinDate: user.createdAt,
          type: user.googleId ? 'Google' : 'Email',
          email: decryptEmail(user.email),
          name: user.fullname,
          country: user.countryCode,
          language: user.language,
          subscription: subscription,
          subscriptionView: subscription
            ? '구독'
            : user?.licenses?.length > 0
            ? '발행'
            : '',
          subscriptionPay: subscription
            ? '유료'
            : user?.licenses?.length > 0
            ? '무료'
            : '',
          subscriptionProduct: (user as any).subscriptionProduct,
          subscriptionStatus: subscriptionStatus,
          leavedDate: accountExts?.leavedDate,
        };
      }),
    );

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      members = members.filter((member) => {
        return (
          member.email.toLowerCase().includes(searchLower) ||
          member.name.toLowerCase().includes(searchLower)
        );
      });
    }

    return members;
  }

  // 사용자 ID 기준 라이선스 조회
  async getLicensesByUserId(userId: number): Promise<LicenseDto[]> {
    return this.licenseService.getLicensesByUser(userId);
  }

  // 사용자 ID 기준 결제 내역 조회
  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return this.paymentRepository.find({ where: { user: { id: userId } } });
  }

  /* async registerCode(email: string, help?: boolean, language = 'en', schools = false) {
    if (!help) {
      const existing = await this.usersRepository.findOne({ where: { email: encryptEmail(email), validType: 'valid' } });
      if (existing) {
        return { msg: 'err1' };
      }
    }
    if (help && !schools) {
      const users = await this.usersRepository.findOne({ where: { email: encryptEmail(email) } });
      if (!users) return { msg: 'help_err' };
      if (users?.googleId !== null) {
        return { msg: 'help_err_google' };
      }
      const accountExt = await this.accountExtRepository.findOne({ where: { accountDataId: Number(users.id) } });
      if (accountExt?.leavedDate !== null && accountExt) {
        return { msg: 'help_err_abort' };
      }
    }
    const code = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const subject = language === 'ko' ? '[UModeler]요청하신 인증번호 안내입니다.' : '[UModeler]Your verification code is on its way.';
    const htmlTemplate = `
              <div style="max-width: 440px; width: 100%; padding: 20px;">
                  <div
                      style="background: #fff; border: 1px solid #eee; border-radius: 20px; box-shadow: 4px 4px 20px rgba(0, 0, 0, 0.10);
                      max-width: 400px; width: 100%; padding: 40px;"
                  >

                      <p style="font-size: 22px; font-weight: 700; color: #121316; text-align: center; margin-bottom: 20px; width: 100%;
                          margin-top: 0;"
                      >
                          UModeler X
                      </p>

                      <p
                          style="font-size: 24px; font-weight: 700; color: #121316; margin: 0; text-align: center; margin-bottom: 40px;
                          padding-bottom: 40px; border-bottom: 1px solid rgba(238, 238, 238, 1); width: 100%;"
                      >
                          ${language === 'ko'
        ? '요청하신 <span style="font-size: 24px; font-weight: 700; color: #0E6AF4;">인증번호</span>를<br />발송해 드립니다.'
        : 'We have sent your requested <span style="font-size: 24px; font-weight: 700; color: #0E6AF4;">Verification Code</span>.<br />Please check your email.'}
                      </p>

                      <p style="font-size: 14px; color: #121316; line-height: 20px; width: 100%; text-align: center;">
                          ${language === 'ko'
        ? '아래의 인증번호를 인증번호 입력창에 입력해 주세요.'
        : 'Please enter the verification code below into the input field.'}
                      </p>

                      <p
                          style="color: #121316; font-size: 24px; text-align: center; margin-bottom: 40px;
                          padding-bottom: 40px; border-bottom: 1px solid rgba(238, 238, 238, 1); width: 100%;
                          margin-top: 12px; font-weight: 700;"
                      >
                          ${code}
                      </p>

                      <p style="font-size: 14px; color: #666; line-height: 20px; width: 100%; text-align: center;">
                          ${language === 'ko'
        ? '본 메일은 발신전용 입니다.'
        : 'This is an automated email. Please do not reply.'}
                      </p>
                  </div>
              </div>`;
    const htmlString = htmlTemplate.replace('%code', code);

    console.log("code : ", code);

    try {
      await sendEmail(subject, htmlString, email);
      await this.verificationCodeRepository.delete({ email });
      await this.verificationCodeRepository.save({ email, code });

      return code;
    } catch (error) {
      console.error('Error sending email: ', error);
      return { msg: 'help_err' };
    }
  } */

  /**
   * email, code 검증
   */
  /* async verifyCode(email: string, code: string): Promise<boolean> {
    const record = await this.verificationCodeRepository.findOne({
      where: { email, code },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      return false;
    }

    await this.verificationCodeRepository.delete(record.id);
    // const now = new Date().getTime();
    // const createdTime = record.createdAt.getTime();
    // const diffMinutes = (now - createdTime) / 1000 / 60;
    // if (diffMinutes > 5) {
    //   return false;
    // }

    return true;
  } */

  async addInvite(userId: number, teamId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { msg: 'User not found' };
    }

    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      return { msg: 'Team not found' };
    }

    let accountExt = await this.accountExtRepository.findOne({
      where: { accountDataId: userId },
      relations: ['teamInvited', 'team'],
    });

    if (!accountExt) {
      accountExt = this.accountExtRepository.create({
        accountDataId: userId,
        emailLanguage: 'en',
      });
    }

    // if (accountExt.teamInvited) {
    //   return { msg: 'err5' };
    // }

    // if (accountExt.team) {
    //   return { msg: 'err4' };
    // }

    // accountExt.teamInvited = team;
    // accountExt.teamAt = new Date();

    await this.accountExtRepository.save(accountExt);

    return { msg: 'success' };
  }
  async cardById(id: number): Promise<Cardentity[]> {
    const cards = await this.cardentityRepository.find({
      where: { accountId: id },
    });
    return cards;
  }

  async invoiceCker(invoiceCode: string): Promise<any> {
    const resp = await fetch(
      `https://api.assetstore.unity3d.com/publisher/v1/invoice/verify.json?key=DwGa5U9xbIwTD6aEbA5bxp6WHgE&invoice=${invoiceCode}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    const response = await resp.json();
    const invoices = response?.invoices;

    if (invoices.length > 0) {
      // 존재하는 인보이스 코드
      let notUsedInvoice = null;
      let refunded = null;

      for (const i of invoices) {
        refunded = i.refunded === 'Yes';
        if (refunded) continue;
        const subscriptionData = await this.subscriptionRepository.findOne({
          where: { invoiceCode: i.invoice },
        });
        if (!subscriptionData) {
          // 사용되지 않은 인보이스 코드
          notUsedInvoice = i;
          break;
        }
      }

      if (notUsedInvoice) {
        // 사용되지 않은 인보이스 코드
        return {
          message: 'succ.',
          success: true,
          status: 200,
          result: response,
          invoice: notUsedInvoice,
        };
      } else {
        if (refunded)
          return { message: 'refunded', success: false, status: 402 };
        else return { message: 'used', success: false, status: 401 };
      }
    } else {
      // 존재하지 않는 인보이스 코드
      return { message: 'ing', success: false, status: 300, result: 'stay' };
    }
  }

  async apiPayment(
    plan: string,
    priceMonth: number,
    priceDiscYear: number,
    priceOrigYear: number,
    invoice: any,
  ): Promise<any> {
    const price = await this.dataSource
      .createQueryBuilder()
      .select()
      .from(Price, 'p')
      .where('p.name = :plan', { plan })
      .getRawOne();

    if (!price) throw new Error('NOT_EXIST_PLAN');
    const { monthlyUSD, yearlyUSD } = price;

    if (plan === PLAN_ENUM.ENTERPRISE) {
      if (yearlyUSD !== priceMonth || yearlyUSD !== priceOrigYear)
        throw new Error('ORIG_PRICE_NOT_MATCH');
    } else {
      if (monthlyUSD !== priceMonth || yearlyUSD !== priceOrigYear)
        throw new Error('ORIG_PRICE_NOT_MATCH');
    }

    const yearDiscountPercent = this.getYearDiscount(plan, invoice);
    let discountPriceYear = priceOrigYear;
    discountPriceYear = (discountPriceYear * (100 - yearDiscountPercent)) / 100;
    discountPriceYear = Math.round(discountPriceYear * 100) / 100; // 소숫점 2자리 까지 (반올림)
    if (discountPriceYear !== priceDiscYear)
      throw new Error('DISC_PRICE_NOT_MATCH');
  }

  getYearDiscount(plan, invoice) {
    // plan === PLAN_ENUM.PRO => category = 0
    // plan === PLAN_ENUM.PERSONAL => category = 6
    // plan === PLAN_ENUM.ENTERPRISE => category = 2
    const category =
      plan === PLAN_ENUM.PRO ? 0 : plan === PLAN_ENUM.PERSONAL ? 6 : 2;

    let discountPercent = null;
    if (invoice !== false && category !== 2) {
      // 인보이스 할인 (Enterprise 제외)
      const isPro = category === 0;
      // const isXplus = invoice?.package === PKG_ENUM.UM_X_PLUS;
      const isXplus = invoice?.package?.includes(PKG_ENUM.UM_X_PLUS) ?? false;
      const dr = isPro
        ? DR_ENUM.PRO_INV
        : isXplus
        ? DR_ENUM.PER_X_PLUS
        : DR_ENUM.PER_INV;
      discountPercent = dr;
    } else {
      discountPercent = 0;
    }
    return discountPercent;
  }

  async isUsedInvoiceCode(invoiceCode: string): Promise<boolean> {
    const usedInvoice = await this.dataSource
      .createQueryBuilder()
      .select('*')
      .from('subscription_invoice', 'si')
      .where('si.code = :invoiceCode', { invoiceCode })
      .getRawOne();
    if (usedInvoice) return true;

    // insert invoice code
    const invoice = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('subscription_invoice')
      .values({ code: invoiceCode })
      .execute();
    return false;
  }

  async addSubscriptionExt(
    subscriptionId: number,
    couponCode: string,
    coupongroup: any,
    plan: string,
    invoice: any,
  ): Promise<any> {
    try {
      // 쿠폰 사용여부
      // couponCode & couponDisc
      let couponDisc = null;
      if (coupongroup !== null) {
        // 쿠폰사용
        couponDisc = Number(coupongroup?.discount) || 0;
      } else {
        // 쿠폰사용 안함
        couponCode = null;
      }

      // 인보이스 사용여부
      const invoiceDisc = this.getYearDiscount(plan, invoice) || null;
      const values = { subscriptionId, couponCode, couponDisc, invoiceDisc };
      const subsExt = await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('subscription_ext')
        .values(values)
        .execute();
    } catch (error) {
      console.error('[addSubscriptionExt]', error);
    }
  }

  async delInvoiceCode(invoiceCode: string): Promise<any> {
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('subscription_invoice')
      .where('code = :invoiceCode', { invoiceCode })
      .execute();
  }

  async searchInner(email: string, filters: any = {}) {
    const allUsers = await this.usersRepository.find({ where: filters });
    const usersWithAccountExt = await Promise.all(
      allUsers.map(async (user) => {
        const ext = await this.accountExtRepository.findOne({
          where: { accountDataId: user.id },
        });
        return {
          ...user,
          accountExt: ext || { leavedDate: null },
        };
      }),
    );

    const matchingUsers = usersWithAccountExt.filter((user) => {
      const decryptedEmail = decryptEmail(user.email);
      return (
        decryptedEmail.toLowerCase().includes(email.toLowerCase()) &&
        user.accountExt.leavedDate === null
      );
    });

    console.log(
      'usersWithAccountExt : ',
      usersWithAccountExt,
      ', matchingUsers : ',
      matchingUsers,
    );

    return matchingUsers.map((user) => ({
      ...user,
      email: decryptEmail(user.email),
    }));
  }
}
