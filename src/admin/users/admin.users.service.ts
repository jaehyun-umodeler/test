import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AdminUserDto } from './dtos/admin.user.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { encryptEmail } from 'src/utils/util';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(
    page: number,
    limit: number,
    keyword: string,
    validType: string,
    startDate: Date,
    endDate: Date,
    subscriptionStatus: number,
    providerType: string,
    planType: string,
  ): Promise<ResponseDto<AdminUserDto[]>> {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');
    queryBuilder.leftJoinAndSelect('user.licenses', 'licenses');
    queryBuilder.leftJoinAndSelect('licenses.licenseGroup', 'licenseGroup');
    queryBuilder.leftJoinAndSelect(
      'user.subscriptions',
      'subscriptions',
      'subscriptions.userId = user.id',
    );
    queryBuilder.leftJoinAndSelect('user.accountLink', 'accountLink');
    if (keyword !== null) {
      queryBuilder.andWhere(
        '(user.encrypted_email = :email OR user.fullname LIKE :fullname)',
        { email: encryptEmail(keyword), fullname: `%${keyword}%` },
      );
    }
    if (validType !== null) {
      queryBuilder.andWhere('user.validType = :validType', { validType });
    }
    if (startDate !== null) {
      queryBuilder.andWhere('user.createdAt >= :startDate', { startDate });
    }
    if (endDate !== null) {
      queryBuilder.andWhere('user.createdAt <= :endDate', { endDate });
    }
    if (subscriptionStatus !== null) {
      queryBuilder.andWhere('subscriptions.ingstate = :subscriptionStatus', {
        subscriptionStatus,
      });
    }
    if (providerType !== null) {
      if (providerType === 'google') {
        queryBuilder.andWhere('user.googleId IS NOT NULL');
      } else {
        queryBuilder.andWhere('user.googleId IS NULL');
      }
    }
    if (planType !== null) {
      queryBuilder.andWhere('subscriptions.plan = :planType', { planType });
    }
    const [users, totalCount] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return new ResponseDto(
      users.map((user) => new AdminUserDto(user)),
      totalCount,
    );
  }
}
