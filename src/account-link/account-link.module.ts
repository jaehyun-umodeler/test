import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountLinkController } from './account-link.controller';
import { AccountLinkService } from './account-link.service';
import { AccountLink } from './entities/accountLink.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountLink, User])],
  controllers: [AccountLinkController],
  providers: [AccountLinkService],
  exports: [AccountLinkService],
})
export class AccountLinkModule {}
