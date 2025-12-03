import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { License } from '../../licenses/entities/license.entity';
import { UserOrganization } from '../../organization/entities/user-organization.entity';
import { UserTeam } from '../../team/entities/user-team.entity';
import { TutorialFileUser } from 'src/tutorial-files/entities/tutorial-file-user.entity';
import { UserBenefit } from 'src/benefits/entities/user-benefit.entity';
import { AccountLink } from 'src/account-link/entities/accountLink.entity';

@Entity({ name: 'account_data', synchronize: false })
export class User {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'encrypted_email', unique: true })
  @Index()
  email: string;

  @Column({ name: 'password_digest' })
  password?: string;

  @Column({ name: 'username' })
  @Index()
  username: string;

  @Column({ name: 'fullname' })
  fullname: string;

  @Column({ name: 'countryCode' })
  countryCode: string;

  @Column({ name: 'language' })
  language: string;

  @Column({ name: 'valid_type' })
  validType: string;

  @Column({ name: 'is_accept_terms_of_service' })
  isAcceptTermsOfService: number;

  @Column({ name: 'is_accept_privacy_policy' })
  isAcceptPrivacyPolicy: number;

  @Column({ name: 'is_accept_marketing_activities' })
  isAcceptMarketingActivities: number;

  @Column({ name: 'google_id' })
  @Index()
  googleId: string;

  @Column({ name: 'has_installed_before', default: 0 })
  hasInstalledBefore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => License, (license) => license.user)
  licenses: License[];

  @OneToMany(
    () => UserOrganization,
    (userOrganization) => userOrganization.user,
  )
  userOrganizations: UserOrganization[];

  @OneToMany(() => UserTeam, (userTeam) => userTeam.user)
  userTeams: UserTeam[];

  @OneToMany(
    () => TutorialFileUser,
    (tutorialFileUser) => tutorialFileUser.user,
  )
  tutorialFileUsers: TutorialFileUser[];

  @OneToMany(() => UserBenefit, (userBenefit) => userBenefit.user)
  userBenefits: UserBenefit[];

  @OneToMany(() => AccountLink, (accountLink) => accountLink.user)
  accountLink: AccountLink[];
}
