import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { Team } from 'src/team/entities/team.entity';
import { Organization } from 'src/organization/entities/organization.entity';
import { UsersModule } from 'src/users/users.module';
import { LicensesModule } from 'src/licenses/licenses.module';
import { InvitesModule } from 'src/invites/invites.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, Organization]),
    forwardRef(() => UsersModule),
    forwardRef(() => LicensesModule),
    forwardRef(() => InvitesModule),
  ],
  providers: [TeamService],
  controllers: [TeamController],
  exports: [TeamService],
})
export class TeamModule {}
