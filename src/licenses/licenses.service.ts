import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { LicenseGroup } from './entities/license-group.entity';
import { License } from './entities/license.entity';
import { User } from '../users/entities/user.entity';
import {
  decryptEmail,
  encryptEmail,
  licenseCategoryToCode,
} from 'src/utils/util';
import { EmailService } from 'src/email/email.service';
import { LicenseDto } from './dtos/license.dto';
import { Organization } from 'src/organization/entities/organization.entity';
import { AccountExt } from 'src/users/entities/accountExt.entity';
import { OrganizationService } from 'src/organization/organization.service';
import { OrganizationLicenseGroup } from 'src/organization/entities/organization-license-group.entity';
import { Connection, DataSource } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { UserDto } from 'src/users/dtos/users.dto';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { Subscribeentity } from '../subscriptions/entities/subscribe.entity';
import { Invoice } from 'src/licenses/entities/invoice.entity';
import { ConfigService } from '@nestjs/config';
import {
  LicenseCategory,
  LicenseCode,
  OrganizationRole,
} from 'src/utils/constants';
import { LicenseEmailType } from 'src/email/types/license-email.type';
import { AppException } from 'src/utils/app-exception';

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(LicenseGroup)
    private readonly licenseGroupRepository: Repository<LicenseGroup>,
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(AccountExt)
    private readonly accountExtRepository: Repository<AccountExt>,
    @Inject(forwardRef(() => OrganizationService))
    private readonly organizationService: OrganizationService,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Subscribeentity)
    private subscribeentityRepository: Repository<Subscribeentity>,
    @InjectConnection()
    private readonly connection: Connection,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * 단일(교육용) 라이선스 생성
   */
  async createEduLicense(userId: number, expiredAt: Date): Promise<License> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const accountExt = await this.accountExtRepository.findOne({
      where: { accountDataId: userId },
    });
    const existingGroup = await this.licenseGroupRepository.findOne({
      where: {
        licenseCategory: 3,
        licenses: { userId },
      },
      relations: ['licenses'],
    });
    console.log('existingGroup : ', existingGroup);

    const existing = existingGroup ? existingGroup.licenses[0] : null;

    console.log('existing : ', existing);
    if (existing) {
      const createdAtDate = new Date(existing.createdAt);
      // const revokedAt = existing.revokedAt
      //   ? new Date(existing.revokedAt)
      //   : new Date(createdAtDate.setFullYear(createdAtDate.getFullYear() + 1));

      const updateExpiredAt = expiredAt;
      console.log('updateExpiredAt : ', updateExpiredAt);
      // await this.licenseRepository.save(existing);
      await this.licenseGroupRepository.save({
        ...existingGroup,
        expiredAt: updateExpiredAt,
      });
      existing.revokedAt = null;
      await this.licenseRepository.save(existing);
      const res = await this.licenseRepository.findOne({
        where: { user: { id: userId }, licenseCode: existing.licenseCode },
        relations: ['licenseGroup'],
      });
      console.log('res : ', res);
      return res;
    } else {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const licenseGroup = await this.createLicenseWithOwner(
        user,
        1,
        new Date(),
        expiredAt,
        3,
        '',
      );

      return licenseGroup.licenses[0];
    }
  }

  // 중복체크 (칼럼에 제약조건이 없어, 중복처리 필요)
  async generateUniqueGroupId(
    plan: string,
    counts: number,
    isGroup: boolean,
  ): Promise<string> {
    let groupId: any;
    let existing = null;
    let randCnt = 4;
    let tryCount = 0;

    do {
      groupId = this.generateGroupId(plan, counts, randCnt);
      if (isGroup) {
        // license_group
        existing = await this.licenseGroupRepository.findOne({
          where: { groupId },
        });
      } else {
        // license
        existing = await this.licenseRepository.findOne({
          where: { licenseCode: groupId },
        });
      }
      // 6개는 무조건 종료
      if (randCnt === 6) existing = null;

      // 10회 이상 시도후 중복이면 문자 1개 추가
      if (tryCount > 10) {
        randCnt++;
        tryCount = 0;
      }

      tryCount++;
    } while (existing);
    return groupId;
  }

  /**
   * 그룹 ID(8자리) 자동 생성 (간단 예시)
   */
  // rand : 4자리 랜덤 문자열
  // year : 년도 마지막 2자리
  private generateGroupId(
    plan: string,
    counts: number,
    randCnt: number = 4,
  ): string {
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    const rand = randomStr.padEnd(randCnt, 'X').substring(0, randCnt);
    const count = counts;
    const date = new Date();
    return `UMX-${plan}-${count}-${rand}-${date
      .getFullYear()
      .toString()
      .slice(-2)}`;
  }

  /**
   * 필터를 이용하여 라이선스 그룹 조회
   */
  async getLicenseGroups(filters: {
    startDate?: string;
    endDate?: string;
    email?: string;
  }): Promise<LicenseGroup[]> {
    const query = this.licenseGroupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.groupOwner', 'groupOwner')
      .leftJoinAndSelect('group.licenses', 'license')
      .leftJoinAndSelect('license.user', 'licenseUser') // license.user 정보도 함께 로드
      .leftJoinAndMapOne(
        'group.subscribe',
        Subscription,
        'subscribe',
        'group.groupId = subscribe.licenseCode COLLATE utf8mb4_0900_ai_ci',
      );

    // if (filters.startDate) {
    //   query.andWhere('group.createdAt >= :startDate', { startDate: filters.startDate });
    // }
    // if (filters.endDate) {
    //   query.andWhere('group.createdAt <= :endDate', { endDate: filters.endDate });
    // }

    let groups = await query.getMany();

    const bulks = await this.dataSource
      .createQueryBuilder()
      .select()
      .from('license_group_bulk', 'lgb')
      .getRawMany();

    // insert bulk info
    groups = groups.map((group) => {
      const gbs = bulks
        .filter((bulk) => bulk.licenseGroupId === group.id)
        .map((bulk) => ({ bulkId: bulk.bulkId, createdAt: bulk.createdAt }));

      if (gbs.length === 0) return { ...group };
      else return { ...group, bulks: gbs };
    });

    if (filters.email) {
      const emailSearch = filters.email.toLowerCase();
      groups = groups.filter((group) => {
        // 그룹장 배열이 있을 경우 첫 번째 그룹장을 기준으로 검색
        if (group.groupOwner && group.groupOwner.length > 0) {
          const decryptedEmail = decryptEmail(group.groupOwner[0].email);
          //return decryptedEmail.toLowerCase().includes(emailSearch);
          return decryptedEmail;
        }
        return false;
      });
    }

    groups = groups.map((group) => {
      if (group.groupOwner && group.groupOwner.length > 0) {
        const decryptedEmail = decryptEmail(group.groupOwner[0].email);
        const { password, ...rest } = group.groupOwner[0];
        group.groupOwner[0] = { ...rest, email: decryptedEmail };
      }

      // 기간(period): createdAt과 expiredAt 차이 (일수)
      const issuedAt = new Date(group.createdAt).getTime();
      const expiredAt = new Date(group.expiredAt).getTime();
      group['period'] = Math.floor(
        (expiredAt - issuedAt) / (1000 * 60 * 60 * 24),
      );

      group.licenses = group.licenses.map((license) => {
        if (license.user) {
          const decryptedUserEmail = decryptEmail(license.user.email);
          const { password, ...userWithoutPassword } = license.user;
          license.user = { ...userWithoutPassword, email: decryptedUserEmail };
        }
        return license;
      });

      return group;
    });

    return groups;
  }

  /**
   * 특정 라이선스 그룹 정보 조회
   */
  async getLicenseGroup(groupId: number): Promise<LicenseGroup> {
    const group = await this.licenseGroupRepository.findOne({
      where: { id: groupId },
      relations: ['licenses', 'groupOwner', 'licenses.user'],
    });
    if (!group) {
      throw new NotFoundException('해당 라이선스 그룹을 찾을 수 없습니다.');
    }

    if (group.groupOwner && group.groupOwner.length > 0) {
      const decryptedOwnerEmail = decryptEmail(group.groupOwner[0].email);
      const { password, ...ownerWithoutPassword } = group.groupOwner[0];
      group.groupOwner[0] = {
        ...ownerWithoutPassword,
        email: decryptedOwnerEmail,
      };
    }

    group.licenses = group.licenses.map((license) => {
      if (license.user) {
        const decryptedUserEmail = decryptEmail(license.user.email);
        const { password, ...userWithoutPassword } = license.user;
        license.user = { ...userWithoutPassword, email: decryptedUserEmail };
      }
      return license;
    });

    return group;
  }

  async getLicenseGroupall(ids: any) {
    console.log(ids);
    const group = await this.licenseGroupRepository.find({
      where: { id: In(ids) },
      relations: ['licenses', 'groupOwner', 'licenses.user'],
    });
    if (!group) {
      throw new NotFoundException('해당 라이선스 그룹을 찾을 수 없습니다.');
    }

    const groups = group?.map((x, i) => {
      //console.log(x);
      if (x.groupOwner && x.groupOwner.length > 0) {
        const decryptedOwnerEmail = decryptEmail(x.groupOwner[0].email);
        const { password, ...ownerWithoutPassword } = x.groupOwner[0];
        x.groupOwner[0] = {
          ...ownerWithoutPassword,
          email: decryptedOwnerEmail,
        };
      }

      x.licenses = x.licenses.map((license) => {
        if (license.user) {
          const decryptedUserEmail = decryptEmail(license.user.email);
          const { password, ...userWithoutPassword } = license.user;
          license.user = { ...userWithoutPassword, email: decryptedUserEmail };
        }
        return license;
      });
      return x;
    });
    //console.log(groups);

    return groups;
  }

  async getLicenses(
    startDate?: string,
    endDate?: string,
    emailNameLicenseNo?: string,
    category?: string,
    subscriptionType?: string,
    status?: string,
  ): Promise<License[]> {
    const query = this.licenseRepository
      .createQueryBuilder('license')
      .leftJoinAndSelect('license.licenseGroup', 'group')
      .leftJoinAndMapOne(
        'license.subscription',
        Subscription,
        'subscription',
        'group.groupId = subscription.licenseCode COLLATE utf8mb4_0900_ai_ci',
      )
      .leftJoinAndSelect('group.groupOwner', 'groupOwner')
      .leftJoinAndSelect('license.user', 'user');

    if (startDate) {
      query.andWhere('license.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('license.createdAt <= :endDate', { endDate });
    }
    if (emailNameLicenseNo) {
      query.andWhere(
        '(user.email LIKE :search OR user.username LIKE :search OR user.fullname LIKE :search OR license.licenseCode LIKE :search)',
        { search: `%${emailNameLicenseNo}%` },
      );
    }
    if (category) {
      //query.andWhere('group.licenseCategory = :category', { category });
    }
    if (subscriptionType) {
    }
    if (status) {
    }

    const licenses = await query.getMany();

    licenses.forEach((license) => {
      if (license.user) {
        const decryptedUserEmail = decryptEmail(license.user.email);
        const { password, ...userWithoutPassword } = license.user;
        license.user = { ...userWithoutPassword, email: decryptedUserEmail };
      }
      if (
        license.licenseGroup &&
        license.licenseGroup.createdAt &&
        license.licenseGroup.expiredAt
      ) {
        const issuedAt = new Date(license.licenseGroup.createdAt).getTime();
        const expiredAt = new Date(license.licenseGroup.expiredAt).getTime();
        license.licenseGroup['period'] = Math.floor(
          (expiredAt - issuedAt) / (1000 * 60 * 60 * 24),
        );
      }
      if (
        license.licenseGroup &&
        license.licenseGroup.groupOwner &&
        license.licenseGroup.groupOwner.length > 0
      ) {
        const decryptedOwnerEmail = decryptEmail(
          license.licenseGroup.groupOwner[0].email,
        );
        const { password, ...ownerWithoutPassword } =
          license.licenseGroup.groupOwner[0];
        license.licenseGroup.groupOwner[0] = {
          ...ownerWithoutPassword,
          email: decryptedOwnerEmail,
        };
      }
    });

    // trial 라이선스 추가
    const trialLicenses: any[] = [];
    const trialQuery = `SELECT * FROM trial_data`;
    const trial = await this.connection.query(trialQuery);
    for (const item of trial) {
      const user = await this.userRepository.findOne({
        where: { id: item.user_uid },
      });
      if (!user) {
        continue;
      }
      const userDto = await this.userService.toUserDto(user);
      userDto.email = decryptEmail(userDto.email);
      trialLicenses.push({
        id: item.seq,
        userId: item.user_uid,
        createdAt: item.created_at,
        revokedAt: null,
        licenseCode: item.plan,
        user: userDto,
        licenseGroup: {
          createdAt: item.created_at,
          expiredAt: item.expired_at,
          licenseCategory: 0,
          groupId: '',
          groupOwner: userDto,
          period: Math.floor(
            (new Date(item.expired_at).getTime() -
              new Date(item.created_at).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        },
      });
    }

    // plus 라이선스 추가
    // CheckLicense 프로시저 참고
    const invoices = await this.dataSource
      .getRepository(Invoice)
      .createQueryBuilder('iv')
      .innerJoinAndMapOne(
        'iv.user',
        User,
        'u',
        'iv.userUid = u.id AND iv.product = 1',
      )
      .getMany();

    const plusLicenses: any[] = invoices.map((iv: any) => {
      iv.user.email = decryptEmail(iv.user.email);
      return {
        id: iv.seq,
        userId: iv.userUid,
        createdAt: iv.createdAt,
        licenseCode: iv.invoice,
        user: iv.user,
        licenseGroup: {
          createdAt: iv.createdAt,
          licenseCategory: 100,
          groupOwner: iv.user,
        },
      };
    });
    // const plusLicenses = [];

    licenses.push(...plusLicenses, ...trialLicenses);
    return licenses.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  /**
   * 라이선스 할당 (그룹장 혹은 관리자 권한이 호출한다고 가정)
   */
  async assignLicense(licenseId: number, userId: number): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId },
      relations: ['user', 'licenseGroup', 'licenseGroup.groupOwner'],
    });
    if (!license) {
      throw new NotFoundException('라이선스를 찾을 수 없습니다.');
    }
    if (license.revokedAt) {
      throw new BadRequestException('이미 회수된 라이선스입니다.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('할당받을 유저를 찾을 수 없습니다.');
    }

    license.user = user;
    license.attachedAt = new Date();

    await this.licenseRepository.save(license);
    const accountExt = await this.accountExtRepository.findOne({
      where: { accountDataId: userId },
    });
    let lang = 'en';
    if (accountExt) {
      lang = accountExt.user.language;
    }

    const userName =
      decryptEmail(user.email) +
      (user.fullname && user.fullname.length > 0 ? `(${user.fullname})` : '');

    const owner = license.licenseGroup.groupOwner[0];
    const ownerName =
      decryptEmail(owner.email) +
      (owner.fullname && owner.fullname.length > 0
        ? `(${owner.fullname})`
        : '');

    await this.emailService.sendLicenseNotification(LicenseEmailType.ISSUED, {
      email: decryptEmail(user.email),
      language: lang,
      userName,
      licenseCode: license.licenseCode,
      ownerName,
      licensePage: `${this.configService.get('domain.frontend')}/${
        user.validType === 'valid' ? 'licensing' : 'login'
      }`,
      licenseCategory: license.licenseGroup.licenseCategory,
    });

    return license;
  }

  /**
   * 라이선스 회수
   */
  // 개별 라이선스 그룹 개별 라이선스 회수
  async revokeLicense(licenseId: number): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId },
      relations: ['user', 'licenseGroup', 'licenseGroup.groupOwner'],
    });
    if (!license) {
      throw new NotFoundException('라이선스를 찾을 수 없습니다.');
    }
    if (license.revokedAt) {
      throw new BadRequestException('이미 회수된 라이선스입니다.');
    }

    const accountExt = await this.accountExtRepository.findOne({
      where: { accountDataId: license.userId },
    });

    const lang = accountExt.user.language;
    const licenseGroup = license.licenseGroup;
    const user = license.user;

    if (user) {
      const name =
        decryptEmail(user.email) +
        (user.fullname && user.fullname.length > 0 ? `(${user.fullname})` : '');

      await this.emailService.sendLicenseNotification(
        LicenseEmailType.REVOKED,
        {
          email: decryptEmail(user.email),
          language: lang,
          userName: name,
          licenseCode: licenseGroup.groupId,
          licenseCategory: licenseGroup.licenseCategory,
        },
      );
    }

    //license.user = null;
    license.revokedAt = new Date();
    await this.licenseRepository.save(license);

    return license;
  }

  /**
   * 라이선스 회수
   */
  async revokenotduserLicense(licenseId: number): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId },
      relations: ['user', 'licenseGroup', 'licenseGroup.groupOwner'],
    });
    if (!license) {
      throw new NotFoundException('라이선스를 찾을 수 없습니다.');
    }
    if (license.revokedAt) {
      throw new BadRequestException('이미 회수된 라이선스입니다.');
    }

    const accountExt = await this.accountExtRepository.findOne({
      where: { accountDataId: license.userId },
    });

    const lang = accountExt.user.language;
    const licenseGroup = license.licenseGroup;
    const user = license.user;

    if (user) {
      const name =
        decryptEmail(user.email) +
        (user.fullname && user.fullname.length > 0 ? `(${user.fullname})` : '');

      await this.emailService.sendLicenseNotification(
        LicenseEmailType.REVOKED,
        {
          email: decryptEmail(user.email),
          language: lang,
          userName: name,
          licenseCode: licenseGroup.groupId,
          licenseCategory: licenseGroup.licenseCategory,
        },
      );
    }

    //license.user = null;
    license.revokedAt = new Date();
    await this.licenseRepository.save(license);

    return license;
  }

  /*
   *front 에서 license 비활성화
   */
  async removeLicense(
    licenseId: number,
    ownerId?: number,
    userIdR?: number,
  ): Promise<void> {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId },
      relations: ['user', 'licenseGroup', 'licenseGroup.groupOwner'],
    });

    const userId = userIdR || license.user?.id;
    if (license && !license.revokedAt && license.user) {
      license.user.licenses = null;
      license.user = null;
      // license.revokedAt = new Date();
      await this.licenseRepository.save(license);

      if (userId) {
        const accountExt = await this.accountExtRepository.findOne({
          where: { accountDataId: userId },
        });

        const lang = accountExt.user.language;
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });

        const licenseGroup = license.licenseGroup;

        const owner = ownerId
          ? await this.userRepository.findOne({ where: { id: ownerId } })
          : user;
        const ownerName =
          decryptEmail(owner.email) +
          (owner.fullname && owner.fullname.length > 0
            ? `(${owner.fullname})`
            : '');

        const name =
          decryptEmail(user.email) +
          (user.fullname && user.fullname.length > 0
            ? `(${user.fullname})`
            : '');

        await this.emailService.sendLicenseNotification(
          LicenseEmailType.REMOVED,
          {
            email: decryptEmail(user.email),
            language: lang,
            userName: name,
            licenseCode: licenseGroup.groupId,
            ownerName,
            licenseCategory: licenseGroup.licenseCategory,
          },
        );
      }
    }
    // const organization = await this.organizationService.getOrganizationByUser(
    //   userId,
    // );
    // return organization;
  }

  /**
   * 라이선스 그룹 전체 회수
   */
  // 개별 라이선스 그룹 전체 라이선스 회수
  async revokeAllLicenses(licenseGroupId: number): Promise<Boolean> {
    const group = await this.licenseGroupRepository.findOne({
      where: { id: licenseGroupId },
      relations: ['licenses', 'groupOwner', 'licenses.user'],
    });

    if (!group) {
      throw new NotFoundException('라이선스 그룹을 찾을 수 없습니다.');
    }

    // license_group.groupId = subscription.licenseCode COLLATE utf8mb4_0900_ai_ci
    const subsLicenseCode = group.groupId;
    const subs = await this.subscriptionRepository.findOne({
      where: { licenseCode: subsLicenseCode },
    });
    const subscriptionId = subs?.id ?? null;

    // 모든 라이선스 회수일시 기입
    for (const license of group.licenses) {
      license.user = null;
      license.revokedAt = new Date();
    }
    await this.licenseRepository.save(group.licenses);

    // 라이선스 그룹 만료일시 현재시간 갱신
    const moment = require('moment');
    const expiredAt = moment().format('YYYY-MM-DD HH:mm:ss');
    await this.licenseGroupRepository.update(
      {
        id: licenseGroupId,
      },
      {
        expiredAt: expiredAt,
      },
    );

    // 구독이 존재하면 만료처리
    if (subscriptionId) {
      // 구독 즉시 만료 (4)
      await this.subscriptionRepository.update(
        {
          id: subscriptionId,
        },
        {
          ingstate: 4,
        },
      );

      // 구독 결제 즉시 만료 (0, 2, 3) -> (4)
      await this.subscribeentityRepository.update(
        {
          subscriptionId: subscriptionId,
          ingstate: In([0, 2, 3]),
        },
        {
          ingstate: 4,
        },
      );
    }

    console.log('revoke 1');
    const owner = group.groupOwner[0];
    if (owner.validType === 'unknown') {
      console.log('revoke 2');
      for (const license of group.licenses) {
        await this.licenseRepository.delete(license.id);
      }
      console.log('revoke 3');
      await this.licenseGroupRepository.delete(group.id);
      console.log('revoke 4');
      await this.userRepository.delete(owner.id);
      console.log('revoke 5');
    }

    return true;
  }

  async revokeAllNotdeleteLicenses(licenseGroupId: number): Promise<Boolean> {
    const group = await this.licenseGroupRepository.findOne({
      where: { id: licenseGroupId },
      relations: ['licenses', 'groupOwner', 'licenses.user'],
    });
    if (!group) {
      throw new NotFoundException('라이선스 그룹을 찾을 수 없습니다.');
    }

    // license_group.groupId = subscription.licenseCode COLLATE utf8mb4_0900_ai_ci
    const subsLicenseCode = group.groupId;
    const subs = await this.subscriptionRepository.findOne({
      where: { licenseCode: subsLicenseCode },
    });
    const subscriptionId = subs?.id ?? null;

    for (const license of group.licenses) {
      //license.user = null;
      license.revokedAt = new Date();
    }
    await this.licenseRepository.save(group.licenses);

    // 라이선스 그룹 만료일시 현재시간 갱신
    const moment = require('moment');
    const expiredAt = moment().format('YYYY-MM-DD HH:mm:ss');
    await this.licenseGroupRepository.update(
      {
        id: licenseGroupId,
      },
      {
        expiredAt: expiredAt,
      },
    );

    // 구독이 존재하면 만료처리
    if (subscriptionId) {
      // 구독 즉시 만료 (4)
      await this.subscriptionRepository.update(
        {
          id: subscriptionId,
        },
        {
          ingstate: 4,
        },
      );

      // 구독 결제 즉시 만료 (0, 2, 3) -> (4)
      await this.subscribeentityRepository.update(
        {
          subscriptionId: subscriptionId,
          ingstate: In([0, 2, 3]),
        },
        {
          ingstate: 4,
        },
      );
    }

    return true;
  }
  /**
   * 특정 유저가 가진 라이선스 조회하지만 팀의 다른사람들은 조회 안함
   */
  async getLicensesByUserWithoutGroup(userId: number): Promise<License[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return [];
    }

    const res = await this.licenseRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    return res;
  }

  /**
   * 특정 유저가 가진 라이선스 조회
   */
  async getLicensesByUser(userId: number): Promise<LicenseDto[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return [];
    }
    const licenses: LicenseDto[] = [];

    const result = await this.licenseRepository.find({
      where: { user: { id: userId } },
      relations: [
        'user',
        'licenseGroup',
        'licenseGroup.groupOwner',
        'licenseGroup.groupManager',
      ],
    });
    for (const license of result) {
      licenses.push(new LicenseDto(license));
    }

    const trialQuery = `SELECT * FROM trial_data WHERE user_uid = ?`;
    const trial = await this.connection.query(trialQuery, [userId]);
    const trialLicenses = await Promise.all(
      trial.map(async (item: any) => {
        const user = await this.userService.toUserDto(
          await this.userRepository.findOne({ where: { id: item.user_uid } }),
        );
        return {
          id: item.seq,
          userId: item.user_uid,
          createdAt: item.created_at,
          revokedAt: null,
          licenseCode: item.plan,
          user: user,
          licenseGroup: {
            createdAt: item.created_at,
            expiredAt: item.expired_at,
            licenseCategory: 0,
            groupId: '',
            groupOwner: [user],
            period: Math.floor(
              (new Date(item.expired_at).getTime() -
                new Date(item.created_at).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          },
        };
      }),
    );
    for (const license of trialLicenses) {
      licenses.push(
        new LicenseDto(
          this.licenseRepository.create({
            id: license.id,
            userId: license.userId,
            user: license.user,
            licenseCode: license.licenseCode,
            licenseGroup: license.licenseGroup,
            createdAt: license.createdAt,
            revokedAt: license.revokedAt,
          }),
        ),
      );
    }

    const invoices = await this.dataSource
      .getRepository(Invoice)
      .createQueryBuilder('iv')
      .innerJoinAndMapOne(
        'iv.user',
        User,
        'u',
        'iv.userUid = u.id AND iv.product = 1 AND u.id = :userId',
      )
      .setParameters({ userId: userId })
      .getMany();
    const plusLicenses = invoices.map((iv: any) => {
      return {
        id: iv.seq,
        userId: iv.userUid,
        createdAt: iv.createdAt,
        licenseCode: iv.invoice,
        user: iv.user,
        licenseGroup: {
          createdAt: iv.createdAt,
          licenseCategory: 100,
          groupOwner: [iv.user],
        },
      };
    });
    for (const license of plusLicenses) {
      licenses.push(
        new LicenseDto(
          this.licenseRepository.create({
            id: license.id,
            userId: license.userId,
            user: license.user,
            licenseCode: license.licenseCode,
            licenseGroup: license.licenseGroup,
            createdAt: license.createdAt,
            revokedAt: null,
          }),
        ),
      );
    }

    return licenses;
  }

  async getFreeLicenseByUser(userId: number) {
    try {
      const query = `SELECT * FROM trial_data WHERE user_uid = ?`;
      const trial = await this.connection.query(query, [userId]);

      if (trial && trial.length > 0) {
        return {
          userId: trial[0].user_uid,
          createdAt: trial[0].created_at,
          revokedAt: null,
          licenseCode: '',
          licenseGroup: {
            createdAt: trial[0].created_at,
            expiredAt: trial[0].expired_at,
            licenseCategory: 4,
            groupId: '',
            groupOwner: [userId],
          },
        };
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  async getLicenseGroupByUser(userId: number): Promise<LicenseGroup[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Not found user');
    }

    let groups = await this.licenseGroupRepository.find({
      where: { groupOwner: { id: userId } },
      relations: ['licenses', 'groupOwner', 'licenses.user'],
    });

    groups = groups.map((group) => {
      if (group.groupOwner && group.groupOwner.length > 0) {
        const decryptedOwnerEmail = decryptEmail(group.groupOwner[0].email);
        const { password, ...ownerWithoutPassword } = group.groupOwner[0];
        group.groupOwner[0] = {
          ...ownerWithoutPassword,
          email: decryptedOwnerEmail,
        };
      }

      group.licenses = group.licenses.map((license) => {
        if (license.user) {
          const decryptedUserEmail = decryptEmail(license.user.email);
          const { password, ...userWithoutPassword } = license.user;
          license.user = { ...userWithoutPassword, email: decryptedUserEmail };
        }
        return license;
      });
      return group;
    });

    return groups;
  }

  /**
   * 특정 LicenseGroup에 Manager를 추가합니다.
   */
  async addManagerToGroup(
    groupId: number,
    userId: number,
  ): Promise<LicenseGroup> {
    const group = await this.licenseGroupRepository.findOne({
      where: { id: groupId },
      relations: ['groupManager', 'groupOwner'],
    });
    if (!group) {
      throw new NotFoundException('LicenseGroup not found');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isOwner =
      group.groupOwner && group.groupOwner.some((owner) => owner.id === userId);

    if (isOwner) {
      group.groupOwner = group.groupOwner.filter(
        (owner) => owner.id !== userId,
      );
    }
    group.groupManager.push(user);
    await this.licenseGroupRepository.save(group);
    return group;
  }

  /**
   * 특정 LicenseGroup에서 Manager를 제거합니다.
   */
  async removeManagerFromGroup(
    groupId: number,
    userId: number,
  ): Promise<LicenseGroup> {
    const group = await this.licenseGroupRepository.findOne({
      where: { id: groupId },
      relations: ['groupManager'],
    });
    if (!group) {
      throw new NotFoundException('LicenseGroup not found');
    }

    const managerIndex = group.groupManager.findIndex(
      (manager) => manager.id === userId,
    );
    if (managerIndex === -1) {
      throw new BadRequestException('User is not a group manager');
    }

    group.groupManager.splice(managerIndex, 1);
    await this.licenseGroupRepository.save(group);
    return group;
  }

  /**
   * 특정 LicenseGroup에 Owner를 추가합니다.
   */
  async addOwnerToGroup(
    groupId: number,
    userId: number,
  ): Promise<LicenseGroup> {
    const group = await this.licenseGroupRepository.findOne({
      where: { id: groupId },
      relations: ['groupOwner', 'groupManager'],
    });
    if (!group) {
      throw new NotFoundException('LicenseGroup not found');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isManager =
      group.groupManager &&
      group.groupManager.some((manager) => manager.id === userId);
    if (isManager) {
      group.groupManager = group.groupManager.filter(
        (manager) => manager.id !== userId,
      );
    }
    group.groupOwner.push(user);
    await this.licenseGroupRepository.save(group);
    return group;
  }

  /**
   * 특정 LicenseGroup에서 Owner를 제거합니다.
   */
  async removeOwnerFromGroup(
    groupId: number,
    userId: number,
  ): Promise<LicenseGroup> {
    const group = await this.licenseGroupRepository.findOne({
      where: { id: groupId },
      relations: ['groupOwner'],
    });
    if (!group) {
      throw new NotFoundException('LicenseGroup not found');
    }

    const ownerIndex = group.groupOwner.findIndex(
      (owner) => owner.id === userId,
    );
    if (ownerIndex === -1) {
      throw new BadRequestException('User is not a group owner');
    }

    group.groupOwner.splice(ownerIndex, 1);
    await this.licenseGroupRepository.save(group);
    return group;
  }

  /**
   * 라이선스 그룹 생성
   * @param groupOwnerId 그룹장 유저 ID
   * @param totalLicenses 발행 라이선스 개수
   * @param createdAt 발행일
   * @param expiredAt 만료일
   * @returns 생성된 LicenseGroup
   */
  async createLicenseGroup(
    groupOwnerId: number,
    totalLicenses: number,
    createdAt: Date,
    expiredAt: Date,
    licenseCategory: number,
    etc: string,
    email?: string,
    sucEmail?: any,
    paystatus?: number,
  ): Promise<LicenseGroup> {
    if (sucEmail?.length > 1) {
      // 라이선스 그룹 Bulk 발행
      // 이메일 중복제거
      const uniqueSucEmail = [...new Set(sucEmail)];
      sucEmail = uniqueSucEmail;

      // license_group_bulk 테이블의 bulkId 생성
      const bulk = await this.dataSource
        .createQueryBuilder()
        .select(['COALESCE(MAX(lgb.bulkId), 0) AS maxBulkId'])
        .from('license_group_bulk', 'lgb')
        .getRawOne();
      const bulkId = Number(bulk?.maxBulkId ?? 0) + 1;

      const promises = sucEmail?.map(async (x: any, i: number) => {
        const groupOwner = await this.userRepository.findOne({
          where: { email: encryptEmail(x) },
        });
        if (groupOwner) {
          const licenseGroup = await this.createLicenseWithOwner(
            groupOwner,
            totalLicenses,
            createdAt,
            expiredAt,
            licenseCategory,
            etc,
            x,
            paystatus,
          );
          const licenseGroupId = licenseGroup?.id;
          if (licenseGroupId) {
            const values = {
              licenseGroupId,
              bulkId,
              createdAt: new Date(createdAt),
            };
            await this.dataSource
              .createQueryBuilder()
              .insert()
              .into('license_group_bulk')
              .values(values)
              .execute();
          }
          return licenseGroup;
        } else {
          const newUserDto = await this.userService.create({
            email: x,
            validType: 'unknown',
          });

          const newUser = new User();
          newUser.email = newUserDto.email;
          newUser.validType = newUserDto.validType;
          newUser.id = newUserDto.id;
          newUser.createdAt = newUserDto.createdAt;
          newUser.isAcceptMarketingActivities =
            newUserDto.isAcceptMarketingActivities;
          newUser.isAcceptPrivacyPolicy = newUserDto.isAcceptPrivacyPolicy;
          newUser.isAcceptTermsOfService = newUserDto.isAcceptTermsOfService;
          newUser.username = newUserDto.username;
          newUser.fullname = newUserDto.fullname;
          newUser.countryCode = newUserDto.countryCode;
          newUser.language = newUserDto.language;

          let licenseGroup = null;
          try {
            licenseGroup = await this.createLicenseWithOwner(
              newUser,
              totalLicenses,
              createdAt,
              expiredAt,
              licenseCategory,
              etc,
              x,
              paystatus,
            );
            const licenseGroupId = licenseGroup?.id;
            if (licenseGroupId) {
              const values = {
                licenseGroupId,
                bulkId,
                createdAt: new Date(createdAt),
              };
              await this.dataSource
                .createQueryBuilder()
                .insert()
                .into('license_group_bulk')
                .values(values)
                .execute();
            }
          } catch (error) {
            console.log('error : ', error);
          }
          return licenseGroup;
        }
      });
      const results = await Promise.all(promises);
      return sucEmail;
    } else {
      // 단일 라이선스 그룹 생성
      // POST user/XsolaApipayMent > sucEmail == undefined
      const groupOwner = await this.userRepository.findOne({
        where: { id: groupOwnerId },
      });
      if (groupOwner) {
        return await this.createLicenseWithOwner(
          groupOwner,
          totalLicenses,
          createdAt,
          expiredAt,
          licenseCategory,
          etc,
          email,
          paystatus,
        );
      } else {
        // data.username = data.username || '';
        //     data.fullname = data.fullname || '';
        //     data.countryCode = '';
        //     data.language = '';
        //     data.validType = 'valid';
        //     data.isAcceptMarketingActivities = data.isAcceptMarketingActivities || 0;
        //     data.isAcceptPrivacyPolicy = 1;
        //     data.isAcceptTermsOfService = 1;
        //     data.email = encryptEmail(data.email);
        //     data.password = encryptPassword(data.password);
        // 사용자 계정이 없는 경우 (홈페이지 구독결제의 경우 불가능)
        const newUserDto = await this.userService.create({
          email: email,
          validType: 'unknown',
        });

        const newUser = new User();
        newUser.email = newUserDto.email;
        newUser.validType = newUserDto.validType;
        newUser.id = newUserDto.id;
        newUser.createdAt = newUserDto.createdAt;
        newUser.isAcceptMarketingActivities =
          newUserDto.isAcceptMarketingActivities;
        newUser.isAcceptPrivacyPolicy = newUserDto.isAcceptPrivacyPolicy;
        newUser.isAcceptTermsOfService = newUserDto.isAcceptTermsOfService;
        newUser.username = newUserDto.username;
        newUser.fullname = newUserDto.fullname;
        newUser.countryCode = newUserDto.countryCode;
        newUser.language = newUserDto.language;

        let licenseGroup = null;
        try {
          licenseGroup = await this.createLicenseWithOwner(
            newUser,
            totalLicenses,
            createdAt,
            expiredAt,
            licenseCategory,
            etc,
            email,
            paystatus,
          );
        } catch (error) {
          console.log('error : ', error);
        }
        return licenseGroup;
      }
    }
  }

  // license : license_group, license_group_owner, license 생성
  // organization : organization, organization_manager 조건부 생성
  // account : account_ext 조건부 생성 및 account_ext.organizationId 변경
  // 메일발송
  async createLicenseWithOwner(
    groupOwner: User,
    totalLicenses: number,
    createdAt: Date,
    expiredAt: Date,
    licenseCategory: number,
    etc: string,
    email?: string,
    paystatus?: number,
  ): Promise<LicenseGroup> {
    const moment = require('moment');
    const groupOwnerId = groupOwner.id;
    let licenseCode = '';
    switch (licenseCategory) {
      case 0:
        licenseCode = 'PRO';
        break;
      case 1:
        licenseCode = 'ART';
        break;
      case 2:
        licenseCode = 'ALL';
        break;
      case 5:
        licenseCode = 'ENT';
        break;
      case 6:
        licenseCode = 'PER';
        break;
      default:
        licenseCode = 'EDU';
        break;
    }
    let slicenseCode = licenseCode;
    // 8자리 그룹 ID 생성 (예: ABCD1234)
    //console.log("paystatuspaystatus", paystatus);
    // pgj: 중복 체크 필요
    const groupId = await this.generateUniqueGroupId(licenseCode, 0, true);

    if (licenseCategory === 3) {
      const edu = await this.licenseGroupRepository.find({
        where: { licenseCategory: 3, groupOwner: { id: groupOwnerId } },
      });
      console.log('create, edu : ', edu, ', edu.len : ', edu.length);
      if (edu) {
        if (edu.length > 0) {
          const today = new Date();
          const updateExpiredAt = expiredAt;
          console.log('updateExpiredAt : ', updateExpiredAt);
          edu[0].licenses[0].userId = groupOwnerId;
          await this.licenseRepository.save({
            ...edu[0].licenses[0],
            revokedAt: null,
          });
          return await this.licenseGroupRepository.save({
            ...edu[0],
            expiredAt: updateExpiredAt,
          });
        }
      }
    }

    // LicenseGroup 생성
    const licenseGroup = this.licenseGroupRepository.create({
      groupOwner: [groupOwner],
      groupId,
      createdAt,
      expiredAt,
      licenseCategory,
      etc,
      paystatus,
    });
    const savedGroup = await this.licenseGroupRepository.save(licenseGroup);

    console.log(
      'savedGroup, totalLicenses : ',
      savedGroup,
      totalLicenses,
      paystatus,
    );

    // totalLicenses 수만큼 License 생성
    const licenses: License[] = [];
    for (let i = 0; i < totalLicenses; i++) {
      // 4자리(16진수) 카운트 (0001 ~ FFFF)
      const licenseCode = await this.generateUniqueGroupId(
        slicenseCode,
        i,
        false,
      );

      const license = this.licenseRepository.create({
        licenseGroup,
        licenseCode,
      });
      licenses.push(license);
    }
    await this.licenseRepository.save(licenses);

    // 발급 후, 첫 번째 라이선스에 그룹장을 할당 (발급한 라이선스의 첫 user로 자기 자신을 등록)
    let todayDate = moment().format('YYYY-MM-DD HH:mm:ss');
    // 생성한 라이선스 종류와 같은 사용자(라이선스 그룹 소유자)의 만료되지 않은 연결된 라이선스 조회, 중복방지용
    let duplicate = await this.licenseRepository
      .createQueryBuilder('license')
      .leftJoin('license.licenseGroup', 'group')
      .where('group.licenseCategory = :licenseCategory', { licenseCategory })
      .andWhere('group.expiredAt > :todayDate', { todayDate })
      .andWhere('license.user IS NOT NULL')
      .andWhere('license.user.id = :groupOwnerId', { groupOwnerId })
      .getOne();

    // Pro, Personal 라이선스는 중복 할당 허용
    if ([0, 6].includes(licenseCategory)) duplicate = null;
    if (!duplicate && licenses.length > 0) {
      licenses[0].userId = groupOwner.id;
      await this.licenseRepository.save(licenses[0]);
    }

    let existing = await this.organizationRepository
      .createQueryBuilder('organization')
      .leftJoin('organization.userOrganizations', 'userOrganizations')
      .leftJoin('userOrganizations.user', 'user')
      .where('user.id = :groupOwnerId', { groupOwnerId })
      .andWhere('userOrganizations.organizationRole = :organizationRole', {
        organizationRole: OrganizationRole.OWNER,
      })
      .getOne();

    if (!existing) {
      existing = this.organizationRepository.create({
        name: `${groupOwner.fullname}`,
        userOrganizations: [
          {
            user: groupOwner,
            organizationRole: OrganizationRole.OWNER,
          },
        ],
      });
      await this.organizationRepository.save(existing);
    }
    // let accountExt = await this.accountExtRepository.findOne({
    //   where: { accountDataId: groupOwnerId },
    // });
    // if (!accountExt) {
    //   accountExt = await this.accountExtRepository.create({
    //     accountDataId: groupOwnerId,
    //   });
    // }
    // accountExt.organization = existing;
    // await this.accountExtRepository.save(accountExt);
    //if (!duplicate) {
    const lang = groupOwner.language;
    const user = await this.userRepository.findOne({
      where: { id: groupOwnerId },
    });

    const name =
      decryptEmail(user.email) +
      (user.fullname && user.fullname.length > 0 ? `(${user.fullname})` : '');

    await this.emailService.sendLicenseNotification(LicenseEmailType.ISSUED, {
      email: decryptEmail(user.email),
      language: lang,
      userName: name,
      licenseCode: licenseGroup.groupId,
      ownerName: name,
      licensePage: `${this.configService.get('domain.frontend')}/${
        user.validType === 'valid' ? 'Licensing' : 'login'
      }`,
      licenseCategory: licenseGroup.licenseCategory,
    });
    //}

    // 라이선스 정보까지 포함해 반환
    const resultGroup = await this.licenseGroupRepository.findOne({
      where: { id: licenseGroup.id },
      relations: ['licenses'],
    });
    console.log('resultGroup : ', resultGroup);
    return resultGroup;
  }

  /**
   * 사용자의 첫 번째 활성 라이선스를 자동으로 기본으로 설정
   * @param userId 사용자 ID
   * @returns 설정된 기본 라이선스 정보 또는 null
   */
  async setAutoDefaultLicense(userId: number): Promise<LicenseDto | null> {
    // 사용자의 모든 라이선스를 조회 (라이선스 그룹 정보 포함)
    const licenses = await this.licenseRepository.find({
      where: { userId: userId },
      relations: [
        'user',
        'licenseGroup',
        'licenseGroup.groupOwner',
        'licenseGroup.groupManager',
      ],
    });

    // 이미 기본 라이선스가 설정되어 있는지 확인
    const defaultLicense = await this.licenseRepository.findOne({
      where: { userId: userId, isDefault: true },
    });

    if (defaultLicense) {
      return new LicenseDto(defaultLicense);
    }

    // 활성화된 라이선스만 필터링
    const activeLicenses = licenses.filter((license) => {
      // 회수되지 않은 라이선스
      if (license.revokedAt) return false;

      // 만료되지 않은 라이선스 그룹
      if (license.licenseGroup && license.licenseGroup.expiredAt < new Date()) {
        return false;
      }

      return true;
    });

    if (activeLicenses.length > 0) {
      // 첫 번째 활성 라이선스를 기본으로 설정
      await this.setDefaultLicense(userId, activeLicenses[0].id);

      return new LicenseDto(activeLicenses[0]);
    }

    return null;
  }

  /**
   * 사용자의 기본 라이선스 조회
   * @param userId 사용자 ID
   * @returns 기본 라이선스 정보
   */
  async getDefaultLicense(userId: number): Promise<LicenseDto | null> {
    // 기본 라이선스 조회
    const defaultLicense = await this.licenseRepository.findOne({
      where: { userId: userId, isDefault: true },
      relations: [
        'user',
        'licenseGroup',
        'licenseGroup.groupOwner',
        'licenseGroup.groupManager',
      ],
    });

    if (defaultLicense) {
      // 기본 라이선스가 활성화되어 있는지 확인
      const isActive =
        !defaultLicense.revokedAt &&
        defaultLicense.licenseGroup &&
        defaultLicense.licenseGroup.expiredAt > new Date();

      if (isActive) {
        return new LicenseDto(defaultLicense);
      } else {
        // 기본 라이선스가 비활성화된 경우, 기본 설정을 해제하고 새로운 활성 라이선스를 찾음
        await this.unsetDefaultLicense(userId);
      }
    }

    // 기본 라이선스가 설정되지 않았거나 비활성화된 경우, 첫 번째 활성 라이선스를 자동으로 기본으로 설정
    return await this.setAutoDefaultLicense(userId);
  }

  /**
   * 사용자의 기본 라이선스 설정
   * @param userId 사용자 ID
   * @param licenseId 라이선스 ID
   */
  async setDefaultLicense(userId: number, licenseId: number) {
    // 사용자가 해당 라이선스를 소유하고 있는지 확인
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId, userId: userId },
    });

    if (!license) {
      throw new BadRequestException({ errorCode: 'LICENSE_NOT_FOUND' });
    }

    // 해당 사용자의 모든 라이선스의 isDefault를 false로 설정
    await this.licenseRepository.update(
      { userId: userId },
      { isDefault: false },
    );

    // 선택한 라이선스를 기본으로 설정
    await this.licenseRepository.update({ id: licenseId }, { isDefault: true });
  }

  /**
   * 사용자의 기본 라이선스 해제
   * @param userId 사용자 ID
   */
  async unsetDefaultLicense(userId: number) {
    await this.licenseRepository.update(
      { userId: userId },
      { isDefault: false },
    );
  }

  async createOrganizationLicense(
    entityManager: EntityManager,
    licenseGroup: LicenseGroup,
    user: User,
  ): Promise<License> {
    const organizationLicenseGroup = await entityManager.findOne(
      OrganizationLicenseGroup,
      {
        where: { licenseGroup: { id: licenseGroup.id } },
      },
    );

    if (organizationLicenseGroup) {
      await this.organizationService.validateLicenseIssueLimit(
        entityManager,
        organizationLicenseGroup.organizationId,
        licenseGroup.id,
        1,
      );
    }

    const license = await this.createLicense(
      entityManager,
      licenseGroup,
      user,
      0,
    );
    const result = await entityManager.insert(License, license);
    return this.licenseRepository.findOne({
      where: { id: result.identifiers[0].id },
    });
  }

  async createOrganizationLicenses(
    entityManager: EntityManager,
    licenseGroup: LicenseGroup,
    users: User[],
  ): Promise<void> {
    const organizationLicenseGroup = await entityManager.findOne(
      OrganizationLicenseGroup,
      {
        where: { licenseGroup: { id: licenseGroup.id } },
      },
    );

    if (organizationLicenseGroup) {
      await this.organizationService.validateLicenseIssueLimit(
        entityManager,
        organizationLicenseGroup.organizationId,
        licenseGroup.id,
        users.length,
      );
    }

    const licenses: License[] = [];
    for (const [index, user] of users.entries()) {
      const license = await this.createLicense(
        entityManager,
        licenseGroup,
        user,
        index,
      );
      licenses.push(license);
    }
    await entityManager.save(licenses);
  }

  async createFreeLicense(
    entityManager: EntityManager,
    user: User,
    licenseCategory: LicenseCategory,
    days: number,
  ): Promise<void> {
    const groupId = await this.generateUniqueGroupId(
      licenseCategoryToCode(licenseCategory),
      0,
      true,
    );
    const now = new Date();
    now.setDate(now.getDate() + days);
    const licenseGroup = await entityManager.save(
      entityManager.create(LicenseGroup, {
        groupId: groupId,
        licenseCategory: licenseCategory,
        expiredAt: now,
      }),
    );
    const license = await this.createLicense(
      entityManager,
      licenseGroup,
      user,
      0,
    );
    await entityManager.insert(License, license);
  }

  async revokeOrganizationLicenses(
    entityManager: EntityManager,
    licenseGroup: LicenseGroup,
    users: User[],
  ): Promise<void> {
    await entityManager.update(
      License,
      {
        licenseGroup: licenseGroup,
        user: {
          id: In(users.map((user) => user.id)),
        },
      },
      {
        revokedAt: new Date(),
        isDefault: false,
      },
    );
  }

  private async createLicense(
    entityManager: EntityManager,
    licenseGroup: LicenseGroup,
    user: User,
    index: number,
  ): Promise<License> {
    const licenseCode = await this.generateUniqueGroupId(
      licenseCategoryToCode(licenseGroup.licenseCategory),
      index,
      false,
    );
    const existLicenseDefault = await entityManager.exists(License, {
      where: {
        user: { id: user.id },
        isDefault: true,
      },
    });
    return entityManager.create(License, {
      licenseGroup: licenseGroup,
      licenseCode: licenseCode,
      user: user,
      isDefault: !existLicenseDefault,
    });
  }
}
