import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Couponlist } from './entities/couponlist.entity';
import { Coupongroup } from './entities/coupongroup.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Couponlist, Coupongroup])],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
