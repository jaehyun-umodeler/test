import { User } from 'src/users/entities/user.entity';
import { decryptEmail } from 'src/utils/util';
import { AccountLink } from 'src/account-link/entities/accountLink.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { License } from 'src/licenses/entities/license.entity';

export class AdminUserDto {
  constructor(user: User) {
    this.id = user.id;
    this.email = decryptEmail(user.email);
    this.fullname = user.fullname;
    this.type = user.googleId ? 'Google' : 'Email';
    this.accountLinks = user.accountLink;
    this.subscription = user.subscriptions?.[0];
    this.licenses = user.licenses;
    this.language = user.language;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  id: number;
  email: string;
  fullname: string;
  type: string;
  accountLinks: AccountLink[];
  subscription: Subscription;
  licenses: License[];
  language: string;
  createdAt: Date;
  updatedAt: Date;
}
