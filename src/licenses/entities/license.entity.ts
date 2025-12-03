import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LicenseGroup } from './license-group.entity';

@Entity()
export class License {
  @PrimaryGeneratedColumn()
  id: number;

  // 라이선스 그룹
  @ManyToOne(() => LicenseGroup, (licenseGroup) => licenseGroup.licenses, {
    onDelete: 'CASCADE',
  })
  licenseGroup: LicenseGroup;

  // 예) ABCD1234 + 0001
  @Column()
  licenseCode: string;

  // 라이선스를 할당받은 유저
  @ManyToOne(() => User, (user) => user.licenses, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  attachedAt: Date;

  @Column({ nullable: true })
  userId: number;

  // 회수 여부
  @Column({ default: null })
  revokedAt: Date;

  // 라이선스 생성 시점
  @CreateDateColumn()
  createdAt: Date;

  // 기본 라이선스 여부
  @Column({ name: 'is_default', default: false })
  isDefault: boolean;
}
