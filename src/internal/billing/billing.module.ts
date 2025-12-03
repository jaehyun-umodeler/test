import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from '@/email/email.module';
import { LicenseGroup } from '@/licenses/entities/license-group.entity';
import { Subscribeentity } from '@/subscriptions/entities/subscribe.entity';
import { Subscription } from '@/subscriptions/entities/subscription.entity';
import { SubscriptionNew } from '@/subscriptions/entities/subscriptions.entity';
import { Cardentity } from '@/users/entities/card.entity';
import { User } from '@/users/entities/user.entity';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Subscribeentity,
      Cardentity,
      User,
      LicenseGroup,
      SubscriptionNew,
    ]),
    EmailModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
