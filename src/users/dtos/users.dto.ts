// src/users/dto/user-with-account-ext.dto.ts

import { User } from '../entities/user.entity';
import { License } from 'src/licenses/entities/license.entity';
import { Organization } from 'src/organization/entities/organization.entity';
import { Team } from 'src/team/entities/team.entity';

export class UserDto {
  id: number;
  email: string;
  username: string;
  fullname: string;
  countryCode: string;
  language: string;
  validType: string;
  isAcceptTermsOfService: number;
  isAcceptPrivacyPolicy: number;
  isAcceptMarketingActivities: number;
  createdAt: Date;
  googleId: string;
  // AccountExt 필드
  isLeaved: boolean;
  organization: Organization;
  organizationRole: number;
  invitationToken: string;
  license?: License;
  team: Team;

  constructor(
    user: User,
    organization?: Organization,
    organizationRole?: number,
    invitationToken?: string,
    license?: License,
    team?: Team,
  ) {
    this.id = user.id;
    this.email = user.email;
    this.username = user.username;
    this.fullname = user.fullname;
    this.countryCode = user.countryCode;
    this.language = user.language;
    this.validType = user.validType;
    this.isAcceptTermsOfService = user.isAcceptTermsOfService;
    this.isAcceptPrivacyPolicy = user.isAcceptPrivacyPolicy;
    this.isAcceptMarketingActivities = user.isAcceptMarketingActivities;
    this.createdAt = user.createdAt;
    this.googleId = user.googleId;
    this.organization = organization;
    this.organizationRole = organizationRole;
    this.invitationToken = invitationToken;
    this.license = license;
    this.team = team;
  }
}
