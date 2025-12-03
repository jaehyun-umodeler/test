import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SubscriptionNew } from './entities/subscriptions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionStatus } from 'src/utils/constants';
import { AppException } from 'src/utils/app-exception';
import { Subscription } from './entities/subscription.entity';
import { LicenseEmailType } from 'src/email/types/license-email.type';
import { Subscribeentity } from './entities/subscribe.entity';
import { EmailService } from 'src/email/email.service';
import { decryptEmail } from 'src/utils/util';
import { LicenseGroup } from 'src/licenses/entities/license-group.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionNew)
    private subscriptionRepository: Repository<SubscriptionNew>,
    @InjectRepository(Subscription)
    private subscriptionOldRepository: Repository<Subscription>,
    @InjectRepository(Subscribeentity)
    private subscribeTByRepository: Repository<Subscribeentity>,
    private readonly emailService: EmailService,
    @InjectRepository(LicenseGroup)
    private licenseGroupRepository: Repository<LicenseGroup>,
  ) {}

  // Old
  async getSubscriptionById(id: number): Promise<Subscription> {
    return this.subscriptionOldRepository.findOne({
      where: { id: id },
      relations: ['user'],
    });
  }

  async unsubscribeSubscription(id: number): Promise<void> {
    const subscribe = await this.getSubscriptionById(id);
    if (!subscribe) {
      throw AppException.subscriptionNotFound();
    }
    await this.subscriptionOldRepository.update(
      {
        id: id,
        ingstate: 1,
      },
      {
        ingstate: 5,
      },
    );
    await this.subscribeTByRepository.update(
      {
        subscriptionId: id,
        ingstate: 0,
      },
      {
        ingstate: 3,
      },
    );
    const licenseGroup = await this.licenseGroupRepository.findOne({
      where: {
        groupId: subscribe.licenseCode,
      },
    });
    this.emailService.sendLicenseNotification(LicenseEmailType.REVOKED, {
      email: decryptEmail(subscribe.user?.email),
      language: subscribe.user?.language,
      userName: subscribe.user?.fullname,
      licenseCode: licenseGroup?.groupId,
      licenseCategory: licenseGroup?.licenseCategory,
    });
  }

  async cancelUnsubscribe(id: number): Promise<void> {
    const subscribe = await this.getSubscriptionById(id);
    if (!subscribe) {
      throw AppException.subscriptionNotFound();
    }
    await this.subscriptionOldRepository.update(
      {
        id: id,
        ingstate: 5,
      },
      {
        ingstate: 1,
      },
    );
    await this.subscribeTByRepository.update(
      {
        subscriptionId: id,
        ingstate: 3,
      },
      {
        ingstate: 0,
      },
    );
  }

  // New
  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return this.subscriptionOldRepository.find({
      where: { user: { id: userId } },
    });
  }

  async getSubscriptionByOrganizationId(
    organizationId: number,
  ): Promise<SubscriptionNew> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { organization: { id: organizationId } },
      relations: ['organization', 'plan'],
    });
    if (!subscription) {
      throw AppException.subscriptionNotFound();
    }
    return subscription;
  }

  async updateSubscriptionByOrganizationId(
    organizationId: number,
    subscriptionId: string,
    seatQuantity?: number,
    status?: SubscriptionStatus,
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, organization: { id: organizationId } },
    });
    if (!subscription) {
      throw AppException.subscriptionNotFound();
    }
    if (seatQuantity) {
      subscription.seatQuantity = seatQuantity;
    }
    if (status) {
      subscription.status = status;
    }
    await this.subscriptionRepository.save(subscription);
  }
}
