import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { Team } from '../../team/entities/team.entity';
import {
  InvitationStatus,
  InvitationType,
  OrganizationRole,
} from '../../utils/constants';

@Entity({ name: 'invitations' })
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'email', length: 255 })
  email: string;

  @Column({
    name: 'invitation_type',
    type: 'tinyint',
    default: InvitationType.ORGANIZATION_LICENSE,
    comment: '0: Organization, 1: License, 2: Organization and License',
  })
  invitationType: InvitationType;

  @Column({
    name: 'status',
    type: 'tinyint',
    default: InvitationStatus.PENDING,
    comment: '0: Pending, 1: Accepted, 2: Declined, 3: Expired, 4: Cancelled',
  })
  status: InvitationStatus;

  @Column({ name: 'invited_by_user_id', nullable: true })
  invitedByUserId: number;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: number;

  @Column({ name: 'team_id', nullable: true })
  teamId: number;

  @Column({
    name: 'organization_role',
    type: 'tinyint',
    default: OrganizationRole.USER,
    nullable: true,
    comment: 'Role to assign when invitation is accepted',
  })
  organizationRole: OrganizationRole;

  @Column({ name: 'invitation_token', length: 255, unique: true })
  invitationToken: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ name: 'declined_at', type: 'timestamp', nullable: true })
  declinedAt: Date;

  @Column({ name: 'message', type: 'text', nullable: true })
  message: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedByUser: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;
}
