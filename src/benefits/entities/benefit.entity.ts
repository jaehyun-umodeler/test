import {
  Column,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
  BeforeInsert,
  Entity,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
import { uuidv7 } from 'uuidv7';
import { BenefitType } from 'src/utils/constants';
import { UserBenefit } from './user-benefit.entity';
import { CampaignBenefit } from './campaign-benefit.entity';

@Entity({ name: 'benefits' })
export class Benefit {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  id!: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'type', type: 'tinyint' })
  type!: BenefitType;

  @Column({
    name: 'data',
    type: 'text',
    comment: 'JSON string',
  })
  data!: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate!: Date;

  @OneToMany(() => UserBenefit, (userBenefit) => userBenefit.benefit)
  userBenefits!: UserBenefit[];

  @OneToMany(
    () => CampaignBenefit,
    (campaignBenefit) => campaignBenefit.benefit,
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
