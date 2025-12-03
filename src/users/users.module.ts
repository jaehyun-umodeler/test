import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountLinkModule } from 'src/account-link/account-link.module';
import { VerificationCode } from 'src/auth/entities/verification-code.entity';
import { CouponModule } from 'src/coupon/coupon.module';
import { Coupongroup } from 'src/coupon/entities/coupongroup.entity';
import { Couponlist } from 'src/coupon/entities/couponlist.entity';
import { EmailModule } from 'src/email/email.module';
import { EtcModule } from 'src/etc/etc.module';
import { Invitation } from 'src/invitations/entities/invitation.entity';
import { InvitesModule } from 'src/invites/invites.module';
import { LicenseGroup } from 'src/licenses/entities/license-group.entity';
import { License } from 'src/licenses/entities/license.entity';
import { LicensesModule } from 'src/licenses/licenses.module';
import { MailchimpModule } from 'src/mailchimp/mailchimp.module';
import { Organization } from 'src/organization/entities/organization.entity';
import { UserOrganization } from 'src/organization/entities/user-organization.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { Subscribeentity } from 'src/subscriptions/entities/subscribe.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { Team } from 'src/team/entities/team.entity';
import { TeamModule } from 'src/team/team.module';
import { AccountExt } from 'src/users/entities/accountExt.entity';
import { Cardentity } from 'src/users/entities/card.entity';
import { User } from 'src/users/entities/user.entity';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      License,
      Subscription,
      Payment,
      VerificationCode,
      AccountExt,
      Team,
      Organization,
      Cardentity,
      Subscribeentity,
      LicenseGroup,
      Couponlist,
      Coupongroup,
      UserOrganization,
      Organization,
      Invitation,
    ]),
    AccountLinkModule,
    forwardRef(() => EtcModule),
    forwardRef(() => LicensesModule),
    forwardRef(() => InvitesModule),
    forwardRef(() => TeamModule),
    forwardRef(() => EmailModule),
    forwardRef(() => MailchimpModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => CouponModule),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
