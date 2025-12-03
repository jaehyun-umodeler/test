import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionNew } from './entities/subscriptions.entity';
import { User } from '../users/entities/user.entity';
import { LicenseGroup } from 'src/licenses/entities/license-group.entity';
import { Subscribeentity } from './entities/subscribe.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      SubscriptionNew,
      User,
      LicenseGroup,
      Subscribeentity,
    ]),
  ],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
