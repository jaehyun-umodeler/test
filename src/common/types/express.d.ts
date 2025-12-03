import { User as AppUser } from 'src/users/entities/user.entity';
import { Payload } from 'src/auth/types/jwt.type';
import { HubPayload } from './hub';
import { AccountLink } from 'src/account-link/entities/accountLink.entity';
import { GuardProperty } from 'src/auth/types/guard-property.type';

declare global {
  namespace Express {
    interface User extends AppUser {}
    export interface Request {
      [GuardProperty.LOCAL]?: Payload;
      [GuardProperty.VERIFICATION]?: Payload;
      [GuardProperty.ACCESS]?: Payload;
      [GuardProperty.REFRESH]?: Payload;
      [GuardProperty.HUB]?: HubPayload;
      [GuardProperty.ACCOUNT_LINK]?: AccountLink;
    }
  }
}
