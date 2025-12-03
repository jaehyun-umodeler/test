import { registerAs } from '@nestjs/config';

export default registerAs('mailchimp', () => ({
  apiKey: process.env.MAILCHIMP_API_KEY || 'd81fce988f51de6bda17cc54b26e8c2e',
  server: process.env.MAILCHIMP_SERVER || 'us19',
  listId: process.env.MAILCHIMP_LIST_ID || 'c029f330a5',
}));
