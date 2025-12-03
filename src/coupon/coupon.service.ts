import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Couponlist } from 'src/coupon/entities/couponlist.entity';
import { Coupongroup } from 'src/coupon/entities/coupongroup.entity';
import { User } from 'src/users/entities/user.entity';
import { CouponDto } from 'src/coupon/dtos/coupon.dto';
import { decryptEmail } from 'src/utils/util';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Couponlist)
    private couponlistRepository: Repository<Couponlist>,
    @InjectRepository(Coupongroup)
    private couponGroupRepository: Repository<Coupongroup>,
  ) {}

  async getCoupons(user: User): Promise<CouponDto[]> {
    const decryptedEmail = decryptEmail(user.email);
    const couponList: Couponlist[] = await this.couponlistRepository.find({
      where: {
        email: decryptedEmail,
      },
      order: { idx: 'DESC' },
    });
    const couponIds = [
      ...new Set(couponList.map((coupon) => coupon.couponIdx)),
    ];
    const couponGroup = couponIds.length
      ? await this.couponGroupRepository.find({
          where: {
            idx: In(couponIds),
          },
        })
      : [];

    const couponGroupMap = new Map<number, Coupongroup>();
    couponGroup.forEach((group) =>
      couponGroupMap.set(Number(group.idx), group),
    );

    const couponItems: CouponDto[] = couponList.map((coupon) => {
      const relatedGroup = couponGroupMap.get(Number(coupon.couponIdx));

      return {
        issueDate: relatedGroup?.create_dt || null,
        couponCode: coupon.couponCode,
        discount: relatedGroup?.discount,
        validityDate: coupon.validityDate || null,
        status: coupon.status,
      };
    });

    return couponItems;
  }
}
