import { Module, forwardRef } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from 'src/invitations/entities/invitation.entity';
import { User } from 'src/users/entities/user.entity';
import { Organization } from 'src/organization/entities/organization.entity';
import { Team } from 'src/team/entities/team.entity';
import { UsersModule } from 'src/users/users.module';
import { OrganizationModule } from 'src/organization/organization.module';
import { LicensesModule } from 'src/licenses/licenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, User, Organization, Team]),
    forwardRef(() => UsersModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => LicensesModule),
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
