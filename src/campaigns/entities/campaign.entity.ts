import { CampaignBenefit } from 'src/benefits/entities/campaign-benefit.entity';
import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
import { CampaignType } from 'src/utils/constants';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

@Entity({ name: 'campaigns' })
export class Campaign {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  id!: string;

  @Column({ name: 'type', type: 'tinyint' })
  @Index()
  type!: CampaignType;

  @Column({ name: 'code' })
  @Index()
  code!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate!: Date;

  @OneToMany(
    () => CampaignBenefit,
    (campaignBenefit) => campaignBenefit.campaign,
  )
  campaignBenefits!: CampaignBenefit[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
