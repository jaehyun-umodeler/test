import { Global, Module, forwardRef } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountAdmin } from 'src/admin/entities/accountAdmin.entity';
import { VerificationCode } from 'src/auth/entities/verification-code.entity';
import { BenefitsModule } from 'src/benefits/benefits.module';
import { BenefitsService } from 'src/benefits/benefits.service';
import { Benefit } from 'src/benefits/entities/benefit.entity';
import { CampaignBenefit } from 'src/benefits/entities/campaign-benefit.entity';
import { UserBenefit } from 'src/benefits/entities/user-benefit.entity';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { Coupongroup } from 'src/coupon/entities/coupongroup.entity';
import { Couponlist } from 'src/coupon/entities/couponlist.entity';
import { FilesModule } from 'src/files/files.module';
import { LicenseGroup } from 'src/licenses/entities/license-group.entity';
import { License } from 'src/licenses/entities/license.entity';
import { LicensesModule } from 'src/licenses/licenses.module';
import { Payment } from 'src/payments/entities/payment.entity';
import { PlansModule } from 'src/plans/plans.module';
import { ResourceFile } from 'src/resource-files/entities/resource-file.entity';
import { ResourceFilesModule } from 'src/resource-files/resource-files.module';
import { ResourceFilesService } from 'src/resource-files/resource-files.service';
import { Subscribeentity } from 'src/subscriptions/entities/subscribe.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { Team } from 'src/team/entities/team.entity';
import { TutorialFile } from 'src/tutorial-files/entities/tutorial-file.entity';
import { TutorialFilesModule } from 'src/tutorial-files/tutorial-files.module';
import { AccountExt } from 'src/users/entities/accountExt.entity';
import { Cardentity } from 'src/users/entities/card.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

import { AdminAdminUsersController } from './admin-users/admin.admin-users.controller';
import { AdminAdminUsersService } from './admin-users/admin.admin-users.service';
import { AdminController } from './admin.controller';
import { AdminBenefitsController } from './benefits/admin.benefits.controller';
import { AdminCampaignsController } from './campaigns/admin.campaigns.controller';
import { Admin } from './entities/admin.entity';
import { AdminOrganizationsController } from './organizations/admin.organizations.controller';
import { AdminPlansController } from './plans/admin.plans.controller';
import { AdminResourceFilesController } from './resource-files/admin.resource-files.controller';
import { AdminSubscriptionsController } from './subscriptions/admin.subscriptions.controller';
import { AdminTutorialFilesController } from './tutorial-files/admin.tutorial-files.controller';
import { AdminTutorialFilesService } from './tutorial-files/admin.tutorial-files.service';
import { AdminUsersController } from './users/admin.users.controller';
import { AdminUsersService } from './users/admin.users.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      User,
      License,
      Subscription,
      Payment,
      VerificationCode,
      AccountExt,
      Team,
      Cardentity,
      Subscribeentity,
      LicenseGroup,
      Couponlist,
      Coupongroup,
      AccountAdmin,
      TutorialFile,
      Campaign,
      Benefit,
      ResourceFile,
      CampaignBenefit,
      UserBenefit,
    ]),
    forwardRef(() => UsersModule),
    TutorialFilesModule,
    FilesModule,
    PlansModule,
    ResourceFilesModule,
    forwardRef(() => BenefitsModule),
    forwardRef(() => LicensesModule),
    forwardRef(() => SubscriptionsModule),
    RouterModule.register([
      {
        path: 'admin',
        children: [
          {
            path: '',
            module: AdminModule,
          },
        ],
      },
    ]),
  ],
  controllers: [
    AdminController,
    AdminAdminUsersController,
    AdminTutorialFilesController,
    AdminPlansController,
    AdminCampaignsController,
    AdminBenefitsController,
    AdminResourceFilesController,
    AdminSubscriptionsController,
    AdminUsersController,
    AdminOrganizationsController,
  ],
  providers: [
    AdminAdminUsersService,
    AdminTutorialFilesService,
    CampaignsService,
    BenefitsService,
    ResourceFilesService,
    AdminUsersService,
  ],
  exports: [AdminAdminUsersService],
})
export class AdminModule {}
