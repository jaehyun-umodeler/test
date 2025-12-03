import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Benefit } from './benefit.entity';
import { User } from 'src/users/entities/user.entity';
import { uuidv7 } from 'uuidv7';

@Entity({ name: 'user_benefit' })
export class UserBenefit {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  id!: string;

  @Column({ name: 'user_id', type: 'int' })
  @Index()
  userId!: number;

  @Column({
    name: 'benefit_id',
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  @Index()
  benefitId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Benefit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'benefit_id' })
  benefit!: Benefit;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
