import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
import { BillingCycle, PlanType } from 'src/utils/constants';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

@Entity({ name: 'plans' })
export class Plan {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  id: string;

  @Column({
    name: 'type',
    type: 'tinyint',
    comment: '0: Pro Personal, 1: Pro, 2: Enterprise',
  })
  type: PlanType;

  @Column({ name: 'base_price', type: 'int', default: 0 })
  basePrice: number;

  @Column({ name: 'price_per_seat', type: 'int', default: 0 })
  pricePerSeat: number;

  @Column({ name: 'base_seat_quantity', type: 'int', default: 1 })
  baseSeatQuantity: number;

  @Column({
    name: 'billing_cycle',
    type: 'tinyint',
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({ name: 'trial_days', type: 'int', default: 0 })
  trialDays: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
