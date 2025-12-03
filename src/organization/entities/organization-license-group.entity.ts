import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';
import { LicenseGroup } from '../../licenses/entities/license-group.entity';

@Entity({ name: 'organization_license_group' })
@Unique(['organizationId', 'licenseGroupId'])
export class OrganizationLicenseGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'license_group_id' })
  licenseGroupId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(
    () => Organization,
    (organization) => organization.organizationLicenseGroups,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(
    () => LicenseGroup,
    (licenseGroup) => licenseGroup.organizationLicenseGroups,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'license_group_id' })
  licenseGroup: LicenseGroup;
}
