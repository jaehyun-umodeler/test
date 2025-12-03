import { Global, Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountLinkModule } from 'src/account-link/account-link.module';
import { AccountLink } from 'src/account-link/entities/accountLink.entity';
import { AccountAdmin } from 'src/admin/entities/accountAdmin.entity';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/services/auth.service';
import { TokenService } from 'src/auth/services/token.service';
import { VerificationCodeService } from 'src/auth/services/verification-code.service';
import { GoogleStrategy } from 'src/auth/strategies/google.strategy';
import {
  JwtAccessStrategy,
  JwtHubStrategy,
  JwtRefreshStrategy,
  JwtVerificationStrategy,
} from 'src/auth/strategies/jwt.strategy';
import { LocalStrategy } from 'src/auth/strategies/local.strategy';
import { CampaignsModule } from 'src/campaigns/campaigns.module';
import { AccountExt } from 'src/users/entities/accountExt.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

import { RefreshToken } from './entities/refreshToken.entity';
import { VerificationCode } from './entities/verification-code.entity';
import { CookieService } from './services/cookie.service';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      AccountExt,
      AccountLink,
      RefreshToken,
      User,
      AccountAdmin,
      VerificationCode,
    ]),
    AccountLinkModule,
    forwardRef(() => UsersModule),
    CampaignsModule,
  ],
  providers: [
    AuthService,
    TokenService,
    CookieService,
    VerificationCodeService,
    LocalStrategy,
    JwtVerificationStrategy,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtHubStrategy,
    GoogleStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, TokenService, CookieService, VerificationCodeService],
})
export class AuthModule {}
