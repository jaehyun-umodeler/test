import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subscribeentity } from './subscribe.entity';

export enum SubscriptionPlan {
  PRO = 'Pro',
  ART_PASS = 'Art Pass',
  ALL_IN_ONE = 'All-In-One',
  ENTERPRISE = 'Enterprise',
  PERSONAL = 'Personal',
}

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  oriEndDate: Date;

  @Column({
    type: 'tinyint',
    precision: 2,
    comment:
      '0: 구독안함, 1: 구독중, 2: 결제실패, 3: 구독 해지, 4: 구독만료, 5: 해지신청, 9: 기타',
  })
  ingstate: number;

  @Column({ type: 'float', comment: '결제구독료' })
  pay_price: number;

  @Column({
    type: 'float',
    nullable: true,
    default: null,
    comment: '결제구독료(정가)',
  })
  ori_price: number;

  @Column({ type: 'tinyint', precision: 2, comment: '1: 월, 이외 년' })
  planYorM: number;

  @Column()
  licenseCode: string;

  @Column()
  showWon: string;

  @Column()
  invoiceCode: string;

  @Column({
    type: 'datetime',
    nullable: true,
    precision: 0,
    comment: '구독해지신청일',
  })
  endorderDate: Date;

  @OneToMany(() => Subscribeentity, (subscribe) => subscribe.subscription)
  subscribes: Subscribeentity[];
}
