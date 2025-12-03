import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { License } from '../../licenses/entities/license.entity';
import { LicenseGroup } from '../../licenses/entities/license-group.entity';

@Entity({ name: 'account_ext' })
export class AccountExt {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'account_data_id' })
  accountDataId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_data_id' })
  user: User;

  @Column({ name: 'email_language', default: '' })
  emailLanguage: string;

  @Column({ name: 'leaved_date', default: null })
  leavedDate: Date;

  @Column({ name: 'teamId', nullable: true })
  team: number;

  @Column({ name: 'teamInvitedId', nullable: true })
  teamInvited: number;

  @Column({ nullable: true })
  teamAt: Date;

  @OneToMany(() => License, (license) => license.userId)
  licenses: License[];

  @Column({ name: 'organizationId', nullable: true })
  organization: number;

  @ManyToOne(() => LicenseGroup, (licenseGroup) => licenseGroup.accountExts)
  @JoinColumn({ name: 'licenseGroupId' })
  licenseGroup: LicenseGroup;
}
