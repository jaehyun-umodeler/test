import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  JoinTable,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { License } from './license.entity';
import { AccountExt } from '../../users/entities/accountExt.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { OrganizationLicenseGroup } from '../../organization/entities/organization-license-group.entity';

@Entity()
export class LicenseGroup {
  @PrimaryGeneratedColumn()
  id: number;

  // 그룹장 → 이제 여러 명의 그룹장
  @ManyToMany(() => User)
  @JoinTable({
    name: 'license_group_owner',
    joinColumn: {
      name: 'licenseGroupId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  groupOwner: User[];

  // 그룹 관리자 (여러 명)
  @ManyToMany(() => User)
  @JoinTable({
    name: 'license_group_manager',
    joinColumn: {
      name: 'licenseGroupId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  groupManager: User[];

  // 8자리 Prefix (예: ABCD1234)
  @Column({ length: 22 })
  groupId: string;

  // 발행일
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // 만료일 (사용기간의 기준이 될 수 있음)
  @CreateDateColumn({ name: 'expired_at', type: 'timestamp' })
  expiredAt: Date;

  // 라이선스 목록
  @OneToMany(() => License, (license) => license.licenseGroup, { eager: true })
  licenses: License[];

  // 0 : Pro, 1 : Art pass, 2 : All in one, 3 : School
  @Column({ name: 'license_category' })
  licenseCategory: number;

  @Column({ default: null })
  etc: string;

  @Column({ default: 0 })
  price: number;

  @Column({ default: 0 })
  paystatus: number;

  @OneToMany(() => AccountExt, (accountExt) => accountExt.licenseGroup)
  accountExts: AccountExt[];

  @OneToOne(() => Subscription)
  subscription: Subscription;

  @OneToMany(
    () => OrganizationLicenseGroup,
    (orgLicenseGroup) => orgLicenseGroup.licenseGroup,
  )
  organizationLicenseGroups: OrganizationLicenseGroup[];
}
