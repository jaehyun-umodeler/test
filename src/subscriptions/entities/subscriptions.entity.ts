import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  PrimaryColumn,
  BeforeInsert,
} from 'typeorm';
import { OwnerType, SubscriptionStatus } from '../../utils/constants';
import { Plan } from 'src/plans/entities/plan.entity';
import { User } from 'src/users/entities/user.entity';
import { Organization } from 'src/organization/entities/organization.entity';
import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
import { uuidv7 } from 'uuidv7';

@Entity({ name: 'subscriptions' })
export class SubscriptionNew {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  id: string;

  @Column({
    name: 'total_price',
    type: 'bigint',
    default: 0,
  })
  totalPrice: number;

  @Column({
    name: 'owner_type',
    type: 'tinyint',
    default: OwnerType.USER,
    comment: '0: User, 1: Organization',
  })
  ownerType: OwnerType;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  @Index()
  organization: Organization;

  @ManyToOne(() => Plan, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({
    name: 'plan_id',
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  @Index()
  planId: string;

  @Column({ name: 'external_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  externalId: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ name: 'last_billing_date', type: 'timestamp', nullable: true })
  lastBillingDate: Date;

  @Column({ name: 'next_billing_date', type: 'timestamp', nullable: true })
  nextBillingDate: Date;

  @Column({ name: 'seat_quantity', type: 'int', default: 0 })
  seatQuantity: number;

  @Column({ name: 'status', type: 'tinyint', default: SubscriptionStatus.NONE })
  status: SubscriptionStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
