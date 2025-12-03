import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity({ name: 'subscribe_tb', synchronize: false })
export class Subscribeentity {
  @PrimaryGeneratedColumn({ comment: '고유번호' })
  idx: number;

  @Column({ type: 'int', precision: 11, comment: '회원고유번호' })
  userIdx: number;

  @Column({ type: 'int', precision: 11, comment: '결제구독고유번호' })
  subscriptionId: number;

  @Column({ type: 'varchar', length: 255, comment: '카드빌키' })
  billkey: string;

  @Column({
    type: 'tinyint',
    precision: 2,
    comment:
      '0: 예정, 1: 구독중, 2: 결제실패, 3: 구독 해지, 4: 구독만료, 9: 기타',
  })
  ingstate: number;

  @Column({ type: 'float', comment: '결제구독료' })
  pay_price: number;

  @Column({ type: 'datetime', nullable: true, precision: 0, comment: '결제일' })
  pay_dt: Date;

  @CreateDateColumn({
    type: 'datetime',
    precision: 0,
    comment: '생성일',
    default: () => 'CURRENT_TIMESTAMP',
  })
  create_dt: Date;

  @Column({ type: 'datetime', nullable: true, precision: 0, comment: '수정일' })
  update_dt: Date;

  @Column({ type: 'datetime', nullable: true, precision: 0, comment: '삭제일' })
  delete_dt: Date;

  @Column({ type: 'varchar', length: 255, comment: '카드명' })
  cardName: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.subscribes, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;
}
