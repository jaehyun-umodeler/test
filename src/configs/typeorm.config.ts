import { registerAs } from '@nestjs/config';
import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'typeorm',
  (): TypeOrmModuleOptions => {
    const dbHost = process.env.DB_HOST;
    const baseConfig: TypeOrmModuleOptions = {
      type: 'mysql',
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
    };

    if (process.env.NODE_ENV === 'local') {
      return {
        ...baseConfig,
        host: dbHost,
        port: parseInt(process.env.DB_PORT || '3306', 10),
      };
    }
    return {
      ...baseConfig,
      socketPath: dbHost,
    };
}
);
