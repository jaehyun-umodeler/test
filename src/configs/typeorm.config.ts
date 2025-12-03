import { registerAs } from '@nestjs/config';
import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'typeorm',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [join(__dirname, '/../**/*.entity*{.js,.ts}')],
    migrations: [join(__dirname, '/../migrations/**/*{.js,.ts}')],
    migrationsTableName: 'migrations',
    logging: false,
    synchronize: false,
    migrationsRun: true,
    extra: {
      connectionLimit: 100,
    },
    autoLoadEntities: true,
    timezone: 'Z',
  }),
);
