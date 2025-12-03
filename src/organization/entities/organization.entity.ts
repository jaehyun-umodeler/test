// src/entities/organization.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Team } from '../../team/entities/team.entity';
import { UserOrganization } from './user-organization.entity';
import { OrganizationLicenseGroup } from './organization-license-group.entity';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date;

  @OneToMany(() => Team, (team) => team.organization, {
    cascade: true,
  })
  teams: Team[];

  @OneToMany(
    () => UserOrganization,
    (userOrganization) => userOrganization.organization,
  )
  userOrganizations: UserOrganization[];

  @OneToMany(
    () => OrganizationLicenseGroup,
    (orgLicenseGroup) => orgLicenseGroup.organization,
  )
  organizationLicenseGroups: OrganizationLicenseGroup[];

  // @ManyToMany(() => User)
  // @JoinTable({
  //   name: 'organization_manager',
  //   joinColumn: {
  //     name: 'organizationId',
  //     referencedColumnName: 'id',
  //   },
  //   inverseJoinColumn: {
  //     name: 'userId',
  //     referencedColumnName: 'id',
  //   },
  // })
  // organizationManager: User[];

  // @OneToMany(() => AccountExt, (accountExt) => accountExt.organization)
  // accountExts: AccountExt[];
}
