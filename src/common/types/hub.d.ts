export interface HubPayload {
  email: string;
  'cognito:username': string;
  preferred_username: string;
  zoneinfo: string;
  language: string;
  logintype: number;
  'custom:lic': string;
  analytic_enabled: string;
  has_installed_before: string;
  'custom:sublics': HubLicense[];
  license_default: HubLicense;
}

export interface HubLicense {
  name: string;
  expirationDate: string;
  expired: number;
  authority: string;
  subscriptionStatus: number;
}
