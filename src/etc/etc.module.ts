import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Partner } from 'src/etc/entities/partner.entity';
import { Qna } from 'src/etc/entities/qna.entity';
import { Terms } from 'src/etc/entities/terms.entity';
import { Youtube } from 'src/etc/entities/youtube.entity';
import { InvitesModule } from 'src/invites/invites.module';
import { LicensesModule } from 'src/licenses/licenses.module';
import { TeamModule } from 'src/team/team.module';
import { UsersModule } from 'src/users/users.module';

import { EtcController } from './etc.controller';
import { EtcService } from './etc.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Terms, Qna, Partner, Youtube]),
    forwardRef(() => UsersModule),
    forwardRef(() => LicensesModule),
    forwardRef(() => TeamModule),
    forwardRef(() => InvitesModule),
  ],
  providers: [EtcService],
  controllers: [EtcController],
  exports: [EtcService],
})
export class EtcModule {}
