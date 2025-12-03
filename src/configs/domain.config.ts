import { registerAs } from '@nestjs/config';

export default registerAs('domain', () => ({
  frontend: process.env.NODE_ENV === 'local' ? 'http://localhost:3000' : `https://${process.env.DOMAIN_PREFIX_WEB}.umodeler.com`,
  backend: process.env.NODE_ENV === 'local' ? 'http://localhost:5050' : `https://${process.env.DOMAIN_PREFIX_WAS}.umodeler.com`,
}));
