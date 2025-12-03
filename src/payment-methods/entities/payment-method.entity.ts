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
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { PaymentMethodType, OwnerType } from '../../utils/constants';
import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
import { uuidv7 } from 'uuidv7';

@Entity({ name: 'payment_methods' })
export class PaymentMethod {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  id: string;

  @Column({
    name: 'type',
    type: 'tinyint',
    default: PaymentMethodType.CARD,
    comment: '0: Card, 1: Bank Account, 2: PayPal',
  })
  type: PaymentMethodType;

  @Column({
    name: 'data',
    type: 'text',
    comment: 'JSON string',
  })
  data: string;

  @Column({
    name: 'is_default',
    type: 'tinyint',
    default: 0,
  })
  isDefault: number;

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

  @Column({ name: 'external_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  externalId: string;

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
