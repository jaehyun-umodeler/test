// src/entities/team.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { UserTeam } from './user-team.entity';

@Entity()
export class Team {
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

  // 이 팀이 속한 조직 (Organization)
  @ManyToOne(() => Organization, (organization) => organization.teams, {
    onDelete: 'SET NULL', // 조직이 삭제되면 팀은 남거나, 필요에 따라 변경
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  //   // 이 팀에 속한 멤버들 (한 팀에 여러 명)
  //   @OneToMany(() => AccountExt, (user) => user.team, { eager: true })
  //   members: AccountExt[];

  //   @OneToMany(() => AccountExt, (user) => user.teamInvited, { eager: true })
  //   invitedMembers: AccountExt[];

  @OneToMany(() => UserTeam, (userTeam) => userTeam.team)
  userTeams: UserTeam[];
}
