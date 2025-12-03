// src/organization/organization.module.ts
import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { Organization } from 'src/organization/entities/organization.entity';
import { Team } from 'src/team/entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { UserOrganization } from 'src/organization/entities/user-organization.entity';
import { InvitationsModule } from 'src/invitations/invitations.module';
import { Invitation } from 'src/invitations/entities/invitation.entity';
import { LicensesModule } from 'src/licenses/licenses.module';
import { OrganizationLicenseGroup } from 'src/organization/entities/organization-license-group.entity';
import { LicenseGroup } from 'src/licenses/entities/license-group.entity';
import { SubscriptionNew } from 'src/subscriptions/entities/subscriptions.entity';
import { TeamModule } from 'src/team/team.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      Team,
      User,
      UserOrganization,
      Invitation,
      OrganizationLicenseGroup,
      LicenseGroup,
      SubscriptionNew,
    ]),
    forwardRef(() => InvitationsModule),
    forwardRef(() => LicensesModule),
    forwardRef(() => TeamModule),
    forwardRef(() => SubscriptionsModule),
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
