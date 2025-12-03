import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV || 'local',
  apiUrl: process.env.API_URL || 'http://localhost:5050',
}));
