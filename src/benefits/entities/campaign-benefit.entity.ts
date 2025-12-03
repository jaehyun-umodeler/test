import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
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
import { uuidv7 } from 'uuidv7';

@Entity({ name: 'campaign_benefit' })
export class CampaignBenefit {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  id!: string;

  @Column({
    name: 'campaign_id',
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  @Index()
  campaignId!: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign?: Campaign;

  @Column({
    name: 'benefit_id',
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  @Index()
  benefitId!: string;

  @ManyToOne(() => Benefit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'benefit_id' })
  benefit?: Benefit;

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
