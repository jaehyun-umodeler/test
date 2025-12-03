import { CloudTasksClient } from '@google-cloud/tasks';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { In, LessThan, LessThanOrEqual, Repository } from 'typeorm';

import { LicenseGroup } from '@/licenses/entities/license-group.entity';
import { Subscribeentity } from '@/subscriptions/entities/subscribe.entity';
import { Subscription } from '@/subscriptions/entities/subscription.entity';
import { SubscriptionNew } from '@/subscriptions/entities/subscriptions.entity';
import { Cardentity } from '@/users/entities/card.entity';
import { AppException } from '@/utils/app-exception';
import { ErrorCode } from '@/utils/error-codes';
import { decryptEmail } from '@/utils/util';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private client: CloudTasksClient;
  private apiUrl: string;
  private queuePath: string;
  private serviceAccountEmail: string;

  constructor(
    @InjectRepository(SubscriptionNew)
    private subscriptionRepository: Repository<SubscriptionNew>,
    @InjectRepository(Subscription)
    private subscriptionOldRepository: Repository<Subscription>,
    @InjectRepository(Subscribeentity)
    private subscribeentityRepository: Repository<Subscribeentity>,
    @InjectRepository(Cardentity)
    private cardentityRepository: Repository<Cardentity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(LicenseGroup)
    private licenseGroupRepository: Repository<LicenseGroup>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.client = new CloudTasksClient();
    this.apiUrl = this.configService.get<string>('app.apiUrl');
    this.queuePath = this.configService.get<string>(
      'gcp.tasks.billing.queuePath.old',
    );
    this.serviceAccountEmail = this.configService.get<string>(
      'gcp.serviceAccountEmail',
    );
  }

  async dispatchBillingTasks(): Promise<{ count: number; status: string }> {
    const subscribes = await this.subscribeentityRepository.find({
      where: {
        pay_dt: LessThanOrEqual(new Date()),
        ingstate: In([0, 2]), // 0: 예정, 2: 결제실패
        subscription: {
          ingstate: 1,
        },
      },
      relations: ['subscription'],
      order: {
        ingstate: 'DESC',
        pay_dt: 'ASC',
      },
    });
    this.logger.log(`Found ${subscribes.length} subscriptions to charge.`);
    if (subscribes.length === 0) {
      return { count: 0, status: 'no subscribes found' };
    }
    for (const subscribe of subscribes) {
      const payload = {
        subscriptionId: subscribe.idx,
      };
      await this.createTask(
        `${this.apiUrl}/internal/billing/execute-old`,
        payload,
      );
    }
    this.logger.log(`Successfully enqueued ${subscribes.length} tasks.`);
    return { count: subscribes.length, status: 'dispatched' };
  }

  async dispatchExpireTasks() {
    // 구독중(1)이거나, 해지신청(5)인 경우 구독 종료일이 지나면 구독만료(4) 처리
    // subscription.ingstate => 1: 구독중, 3: 구독해지, 4: 구독만료, 5: 해지신청
    // subscribe_tb.ingstate => 0: 예정, 2: 결제실패, 3: 구독해지, 4: 구독만료
    const subscriptions = await this.subscriptionOldRepository.find({
      where: {
        endDate: LessThan(new Date()),
        ingstate: In([1, 5]),
      },
    });
    this.logger.log(`Found ${subscriptions.length} subscriptions to expire.`);
    if (subscriptions.length === 0) {
      return { count: 0, status: 'no subscribes found' };
    }
    for (const subscription of subscriptions) {
      const payload = {
        subscriptionId: subscription.id,
      };
      await this.createTask(
        `${this.apiUrl}/internal/billing/expire-old`,
        payload,
      );
    }
    this.logger.log(`Successfully enqueued ${subscriptions.length} tasks.`);
    return { count: subscriptions.length, status: 'dispatched' };
  }

  async dispatchCreatePendingTasks() {
    // subscription.ingstate => 1: 구독중
    // subscribe_tb.ingstate => 0: 예정
    // 구독중(1)인 구독과 결제예정(0) 또는 결제 실패(2) 구독결제의 존재여부 (has_pending_payment)
    const subscriptions = await this.subscriptionOldRepository
      .createQueryBuilder('subscription')
      .where('subscription.ingstate IN (:...validStates)', { validStates: [1] })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from('subscribe_tb', 'subscribe')
          .where('subscribe.subscriptionId = subscription.id')
          .andWhere('subscribe.ingstate IN (:...blockStates)', {
            blockStates: [0, 2],
          })
          .getQuery();

        return 'NOT EXISTS ' + subQuery;
      })
      .getMany();
    this.logger.log(
      `Found ${subscriptions.length} subscriptions to create pending.`,
    );
    if (subscriptions.length === 0) {
      return { count: 0, status: 'no subscribes found' };
    }
    for (const subscription of subscriptions) {
      const payload = {
        subscriptionId: subscription.id,
      };
      await this.createTask(
        `${this.apiUrl}/internal/billing/create-pending-old`,
        payload,
      );
    }
    this.logger.log(`Successfully enqueued ${subscriptions.length} tasks.`);
    return { count: subscriptions.length, status: 'dispatched' };
  }

  async createTask(url: string, payload: any) {
    const task = {
      httpRequest: {
        httpMethod: 'POST' as const,
        url: url,
        body: Buffer.from(JSON.stringify(payload)).toString('base64'),
        headers: {
          'Content-Type': 'application/json',
        },
        oidcToken: {
          serviceAccountEmail: this.serviceAccountEmail,
        },
      },
    };
    try {
      await this.client.createTask({ parent: this.queuePath, task });
    } catch (error) {
      this.logger.error(`Failed to enqueue task for ${url}`, error);
    }
  }

  async executePayment(subscribeId: number): Promise<void> {
    const subscribe = await this.subscribeentityRepository.findOne({
      where: { idx: subscribeId },
    });
    if (!subscribe) {
      return;
    }
    // [Logic A Start]
    // x: row of subscribe_tb
    // - x.userIdx        : 사용자 ID
    // - x.subscriptionId : 구독 ID
    // - x.pay_dt         : 결제일 (instanceof Date) (pay_dt.toISOString())
    const user = await this.userRepository.findOne({
      where: { id: subscribe.userIdx },
    });
    if (!user) {
      return;
    }
    const card = await this.cardentityRepository.findOne({
      where: { accountId: subscribe.userIdx },
    });
    if (!card) {
      return;
    }
    const subscriptionOld = await this.subscriptionOldRepository.findOne({
      where: { id: subscribe.subscriptionId },
    });
    const failedPymt = await this.subscribeentityRepository.findOne({
      where: { subscriptionId: subscribe.subscriptionId, ingstate: 2 },
    });

    if (!subscriptionOld?.id) {
      await this.subscribeentityRepository.update(
        { subscriptionId: subscribe.subscriptionId },
        { ingstate: 4 }, // 4: 구독만료
      );
      return;
    }
    // 결제실패가 존재하고, x가 결제실패건이 아닌 경우
    // 해당 구독에 결제실패건이 존재하면, 그것부터 처리
    if (failedPymt?.idx && failedPymt?.idx * 1 !== subscribe.idx * 1) {
      return;
    }
    // subscription.ingstate => 1: 구독중
    // [condition 3] subs.ingstate == 1
    if (subscriptionOld?.ingstate * 1 !== 1) {
      return;
    }
    const showWon = subscriptionOld?.showWon;
    const subsStartDate = subscriptionOld?.startDate;
    const subsOriEndDate = subscriptionOld?.oriEndDate;
    if (!subsOriEndDate) {
      return;
    }
    const subsOriEndMoment = moment(subsOriEndDate);
    const subsStartMoment = moment(subsStartDate);
    const payMoment = moment(subscribe.pay_dt);
    const email = decryptEmail(user.email);

    // 등록된 결제 수단 체크
    const responsecard = await this.xsollaGetSavedAccounts(email, card);
    // 현재 API 로직상 사용자별 카드 1개만 등록 가능
    // responsecard[0].id == card.carduserid == pymt.billkey
    // responsecard[0].name == card.cardName == pymt.cardName

    let nowMoment = moment(); // 기준 일시
    if (responsecard?.length < 1) {
      // [Logic A-1 Start]
      // [case 2] 결제 수단 없음
      this.logger.log('[xsolla] { user.id, message }:', user?.id, 'NO CARD');
      await this.handlePayFailure(
        subscribe,
        subscriptionOld,
        user,
        nowMoment,
        payMoment,
        subsOriEndMoment,
      );
      return;
      // [Logic A-1 End]
    }

    // 결제
    // [Logic A-2 Start]
    const paymentresponse = await this.xsollaChargeWithSavedAccount(
      email,
      card,
      responsecard,
      subscribe,
      showWon,
    );
    const billkey = responsecard[0]?.id;
    const cardName = responsecard[0]?.name;
    const paidDate = moment().format('YYYY-MM-DD HH:mm:ss');

    if (!paymentresponse?.transaction_id) {
      // [case 3] 결제 실패
      this.logger.log(
        '[xsolla] { user.id, message }:',
        user?.id,
        'PAYMENT FAILED',
      );
      await this.handlePayFailure(
        subscribe,
        subscriptionOld,
        user,
        nowMoment,
        payMoment,
        subsOriEndMoment,
      );
      return;
    }

    // [case 1] 결제 성공
    // actions
    // - subscribe_tb.ingstate 갱신 (1: 구독중)
    // - subscribe_tb.[billkey, cardName] 갱신 [responsecard[0].id, responsecard[0].name]
    // - subscription.[endDate, oriEndDate] 갱신
    // - license_group.expiredAt 갱신

    // subscription.planYorM: 1: 월, 이외(2): 년
    this.logger.log(
      '[xsolla] { user.id, message }:',
      user?.id,
      'PAYMENT SUCCESS',
    );
    let planPopRadioValue = subscriptionOld?.planYorM;

    // 구독 만료일 연장, 원래 구독 종료일 기준 (subsOriEndMoment)
    // 31일자 복원 시도
    // 날짜 갱신 기준: 구독 시작일 (subsStartMoment), 구독 종료일 (subsOriEndMoment)
    const dt = subsStartMoment.format('DD HH:mm:ss'); // 구독 시작일 일, 시각
    const ym = subsOriEndMoment
      .clone()
      .add(1, planPopRadioValue * 1 === 1 ? 'months' : 'year')
      .format('YYYY-MM'); // 구독 원 종료일 년, 월
    const newOriEndMoment = moment(`${ym}-${dt}`); // 갱신할 구독 종료일 후보
    let newOriEndDate;
    if (newOriEndMoment.isValid()) {
      newOriEndDate = newOriEndMoment.format('YYYY-MM-DD HH:mm:ss');
    } else {
      // moment.clone().add(1, 'months') => 존재하지 않는 날짜면 알아서 월말로 변경 (1-31 12:34:56 => 2-28 12:34:56)
      // newOriEndDate = subsOriEndMoment.clone().add(1, planPopRadioValue * 1 === 1 ? 'months' : 'year').format('YYYY-MM-DD HH:mm:ss');
      // 31 - 28 - 30
      newOriEndDate =
        moment(ym).endOf('month').format('YYYY-MM-DD') +
        ' ' +
        subsStartMoment.format('HH:mm:ss');
    }

    await this.subscribeentityRepository.update(subscribe.idx, {
      ingstate: 1,
      billkey: billkey,
      update_dt: paidDate,
      cardName: cardName,
    });

    await this.subscriptionOldRepository.update(subscribe.subscriptionId, {
      endDate: newOriEndDate,
      oriEndDate: newOriEndDate,
    });

    await this.licenseGroupRepository.update(
      { groupId: subscriptionOld?.licenseCode },
      {
        expiredAt: newOriEndDate,
      },
    );

    // [Logic A-2 End]
    // [Logic A End]
  }

  async payfailSender(user, codes, endDate) {
    try {
      this.logger.log(
        '[payfailSender]',
        moment().format('YYYY-MM-DD HH:mm:ss'),
      );
      if (!user) {
        throw new AppException(ErrorCode.USER_NOT_FOUND);
      }
      this.emailService.sendPaymentFailedEmail(
        decryptEmail(user.email),
        codes,
        moment(endDate).format('YYYY-MM-DD HH:mm:ss'),
        user.language,
      );
      this.logger.log('[payfailSender] { user.id }:', user?.id);
    } catch (error) {
      this.logger.log(
        '[payfailSender] { user.id, error }:',
        user?.id,
        error.message,
      );
    }
  }

  // 등록된 결제 수단 체크
  async xsollaGetSavedAccounts(email, card) {
    let url;
    try {
      if (!card?.accountId) return [];

      const MERCHANT_ID = process.env.XSOLLA_MERCHANT_ID || 'your_merchant_id';
      const API_KEY = process.env.XSOLLA_API_KEY || 'your_api_key';
      const PROJECT_ID = Number(process.env.XSOLLA_PROJECT_ID || 0);

      // doc: https://developers.xsolla.com/api/pay-station/operation/get-saved-accounts/
      // user_id = email + card?.accountId
      // user_id이 없는 값이면 응답은 []
      url = `https://api.xsolla.com/merchant/v2/projects/${PROJECT_ID}/users/${email}${card?.accountId}/payment_accounts`;
      if (process.env.NODE_ENV !== 'production') {
        url += '?mode=sandbox';
      }
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Basic ' +
            Buffer.from(`${MERCHANT_ID}:${API_KEY}`).toString('base64'),
        },
      });
      const { status, statusText } = resp;
      if (!(status < 300)) throw new Error(statusText);
      const savedAccounts = await resp.json();
      return savedAccounts;
    } catch (error) {
      this.logger.error(
        '[xsollaGetSavedAccounts] { message, card.idx, url }:',
        error.message,
        card?.idx,
        url,
      );
      return [];
    }
  }

  // 결제
  async xsollaChargeWithSavedAccount(
    email,
    card,
    responsecard,
    subscribe,
    showWon,
  ) {
    let url;
    try {
      // doc: https://developers.xsolla.com/api/pay-station/operation/charge-with-saved-account/#tag/tokenization/operation/charge-with-saved-account
      // user_id = email + card?.accountId
      // account_id = responsecard[0]?.id

      const MERCHANT_ID = process.env.XSOLLA_MERCHANT_ID || 'your_merchant_id';
      const API_KEY = process.env.XSOLLA_API_KEY || 'your_api_key';
      const PROJECT_ID = Number(process.env.XSOLLA_PROJECT_ID || 0);

      let amount = subscribe?.pay_price;

      url = `https://api.xsolla.com/merchant/v2/projects/${PROJECT_ID}/users/${email}${card?.accountId}/payments/card/${responsecard[0]?.id}`;
      const settings: any = {
        currency: showWon,
        save: true,
      };
      if (process.env.NODE_ENV !== 'production') {
        settings.mode = 'sandbox';
      }
      const resp = await fetch(url, {
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
              value: '구독 결제',
            },
            checkout: {
              currency: showWon,
              // "amount": x?.pay_price
              amount: amount,
            },
          },
          settings: settings,
          user: {
            ip: '20.55.53.182',
            name: email,
          },
        }),
      });

      let { status, statusText } = resp;
      if (!(status < 300)) {
        try {
          const r = await resp.json();
          statusText = r.message || statusText;
          // This payment account does not belong to this user.
        } catch (error) {
        } finally {
          throw new Error(statusText);
        }
      }

      const result = await resp.json();
      // result: { transaction_id: 1752905299, status: 'processing' }
      return result;
    } catch (error) {
      console.error(
        '[xsollaChargeWithSavedAccount] { message, card.idx, url }:',
        error.message,
        card?.idx,
        url,
      );
      return {};
    }
  }

  // 결제 실패 핸들러
  async handlePayFailure(
    subscribe,
    subscriptionOld,
    user,
    nowMoment,
    payMoment,
    subsOriEndMoment,
  ) {
    // actions
    // 1. 구독만료 처리 (구독만료시간 경과후)
    // - subscribe_tb.ingstate 갱신 (4: 구독만료)
    // - subscription.ingstate 갱신 (4: 구독만료)
    // - license_group.expiredAt 갱신

    // 2. 결제실패 처리 (구독만료시간 경과전)
    // - subscribe_tb.ingstate 갱신 (2: 결제실패)
    // - subscribe_tb.[pay_dt, delete_dt] 갱신
    // - subscription.endDate 갱신
    // - license_group.expiredAt 갱신
    // - payfailSender 실패메일 발송

    // 구독 만료 처리
    // [condition 4] pymt.delete_dt
    // subscribe_tb.ingstate => 2: 결제실패
    if (subscribe?.ingstate * 1 === 2 && subscribe?.delete_dt !== null) {
      const nowDate = nowMoment.clone(); // 기준일시
      const endDate = moment(subscribe?.delete_dt); // 삭제일시

      // a.diff(b) = a - b [ 1 day : 86400000(ms) ]
      // a.diff(b, 'seconds') = a - b [ 1 day : 86400(s) ]
      // diffSec = endDate - nowDate (seconds)
      const diffSec = endDate.diff(nowDate, 'seconds');
      if (diffSec < 0) {
        this.logger.log(
          '[handlePayFailure] { user.id, subscriptionId, message }:',
          user?.id,
          subscribe?.subscriptionId,
          'SUBSCRIPTION EXPIRATION',
        );

        await this.subscribeentityRepository.update(
          { subscriptionId: subscribe.subscriptionId, ingstate: In([0, 2]) },
          {
            ingstate: 4,
          },
        );

        await this.subscriptionOldRepository.update(subscribe.subscriptionId, {
          ingstate: 4,
        });

        await this.licenseGroupRepository.update(
          { groupId: subscriptionOld?.licenseCode },
          {
            expiredAt: nowMoment.format('YYYY-MM-DD HH:mm:ss'),
          },
        );
        return;
      }
    }

    // 현재시간이 기준이 아니라, 원래 결제일 기준 (payMoment, subsOriEndMoment)
    const updatepayDate = payMoment
      .clone()
      .add(5, 'days')
      .format('YYYY-MM-DD HH:mm:ss'); // 5일 뒤로 수정
    // const updatepayDate = payMoment.clone().add(30, 'seconds').format('YYYY-MM-DD HH:mm:ss'); // 30초 뒤로 수정

    const deleteDate = subsOriEndMoment
      .clone()
      .add(15, 'days')
      .format('YYYY-MM-DD HH:mm:ss'); // 15일 뒤로 수정
    // const deleteDate = subsOriEndMoment.clone().add(90, 'seconds').format('YYYY-MM-DD HH:mm:ss'); // 90초 뒤로 수정

    if (subscribe?.delete_dt === null) {
      this.logger.log(
        '[handlePayFailure] { user.id, subscriptionId, message }:',
        user?.id,
        subscribe?.subscriptionId,
        'GRACE PERIOD FOR PAY FAILURE',
      );

      await this.subscribeentityRepository.update(subscribe.idx, {
        ingstate: 2,
        pay_dt: updatepayDate,
        delete_dt: deleteDate,
      });
    } else {
      this.logger.log(
        '[handlePayFailure] { user.id, subscriptionId, message }:',
        user?.id,
        subscribe?.subscriptionId,
        'PAY FAILURE',
      );

      await this.subscribeentityRepository.update(subscribe.idx, {
        ingstate: 2,
        pay_dt: updatepayDate,
      });
    }

    if (subscribe?.delete_dt === null) {
      // 구독 종료일 설정
      await this.subscriptionOldRepository.update(subscriptionOld?.id, {
        endDate: deleteDate,
      });

      await this.licenseGroupRepository.update(
        { groupId: subscriptionOld?.licenseCode },
        {
          expiredAt: deleteDate,
        },
      );
    }

    if (subscribe?.delete_dt === null) {
      await this.payfailSender(user, subscriptionOld?.licenseCode, deleteDate);
    } else {
      await this.payfailSender(
        user,
        subscriptionOld?.licenseCode,
        subscribe?.delete_dt,
      );
    }
  }

  async expireSubscription(subscriptionId: number) {
    const subscription = await this.subscriptionOldRepository.findOne({
      where: {
        id: subscriptionId,
      },
    });
    if (!subscription) {
      return;
    }
    await this.subscriptionOldRepository.update(subscription.id, {
      ingstate: 4,
    });
    await this.subscribeentityRepository.update(
      { subscriptionId: subscription.id, ingstate: In([0, 2, 3]) }, //  0: 예정, 2: 결제실패, 3: 구독해지, 4: 구독만료
      {
        ingstate: 4,
      },
    );
  }

  async createPendingSubscription(subscriptionId: number) {
    const subscription = await this.subscriptionOldRepository.findOne({
      where: {
        id: subscriptionId,
      },
      relations: ['user'],
    });
    if (!subscription) {
      return;
    }

    const subsStartDate = subscription.startDate;
    const subsOriEndDate = subscription.oriEndDate;
    const planPopRadioValue = subscription.planYorM;
    if (!subsOriEndDate) {
      return;
    }

    const subsStartMoment = moment(subsStartDate);
    const subsOriEndMoment = moment(subsOriEndDate);

    // [Logic B Start]
    // x: 구독 및 가장 이른 구독결제 idx (s1_idx)
    // x: row of subscription
    // 날짜 생성 기준: 구독 시작일 (subsStartMoment), 구독 종료일 (subsOriEndMoment)
    const dt = subsStartMoment.format('DD HH:mm:ss'); // 구독 시작일 일, 시각
    const loopCount = planPopRadioValue * 1 === 1 ? 6 : 2;
    for (let i = 0; i < loopCount; i++) {
      const ym = subsOriEndMoment
        .clone()
        .add(i, planPopRadioValue * 1 === 1 ? 'months' : 'year')
        .format('YYYY-MM'); // 구독 원 종료일 년, 월
      const newPayMoment = moment(`${ym}-${dt}`); // 결제일 후보
      let newPayDate;
      if (newPayMoment.isValid()) {
        newPayDate = newPayMoment.format('YYYY-MM-DD HH:mm:ss');
      } else {
        newPayDate =
          moment(ym).endOf('month').format('YYYY-MM-DD') +
          ' ' +
          subsStartMoment.format('HH:mm:ss');
      }

      // 결제예정 추가
      // 카드정보 미리 기입하는건 무의미 (결제 카드는 변경가능)
      await this.subscribeentityRepository.save({
        userIdx: subscription.user.id,
        billkey: '12345678',
        pay_dt: newPayDate,
        pay_price: subscription.ori_price,
        ingstate: 0,
        subscriptionId: subscription.id,
        cardName: '123456******0000',
      });
    }
    // [Logic B End]
  }
}
