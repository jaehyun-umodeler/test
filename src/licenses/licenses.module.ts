import { forwardRef, Module } from '@nestjs/common';
import { LicenseService } from './licenses.service';
import { LicenseController } from './licenses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './entities/license.entity';
import { User } from '../users/entities/user.entity';
import { LicenseGroup } from 'src/licenses/entities/license-group.entity';
import { Organization } from 'src/organization/entities/organization.entity';
import { AccountExt } from 'src/users/entities/accountExt.entity';
import { Team } from 'src/team/entities/team.entity';
import { UsersModule } from 'src/users/users.module';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { Subscribeentity } from 'src/subscriptions/entities/subscribe.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      License,
      User,
      LicenseGroup,
      Organization,
      AccountExt,
      Team,
      Subscription,
      Subscribeentity,
    ]),
    forwardRef(() => UsersModule),
  ],
  providers: [LicenseService],
  controllers: [LicenseController],
  exports: [LicenseService],
})
export class LicensesModule {}
