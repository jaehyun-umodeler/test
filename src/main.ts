import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';

import { AppModule } from '@/app.module';
import { AppException } from '@/utils/app-exception';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          return Object.values(error.constraints || {}).join(', ');
        });

        return AppException.validationError(messages.join('; '));
      },
    }),
  );
  app.use(cookieParser());
  app.useStaticAssets(join(__dirname, '..', 'assets'));

  if (process.env.NODE_ENV === 'local') {
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3010',
        'http://localhost:3020',
        'http://saas.umodeler.com',
        'https://saas.umodeler.com',
        'http://192.168.0.137',
        'http://192.168.0.137:3002',
        'http://192.168.0.137:3001',
        'https://saas-dev.umodeler.com',
        'https://saas-dev-admin.umodeler.com',
        'http://127.0.0.1:3010',
        'https://unity.umodeler.com',
        'https://saas.umodeler.com',
        'https://saas-admin.umodeler.com',
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
  }

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  const host = process.env.DB_HOST || 'umodeler-db.mysql.database.azure.com';
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
  const username = process.env.DB_USERNAME || 'agent';
  const password = process.env.DB_PASSWORD || 'umodeler33!!!';
  const database = process.env.DB_NAME || 'umodeler';

  console.log('process.env.TEST : ', process.env.TEST);
  console.log('DB Host:', host);
  console.log('DB Port:', port);
  console.log('DB Username:', username);
  console.log('DB Password:', password);
  console.log('DB Name:', database);
  console.log('GOOGLE_CLIENT_ID : ', process.env.GOOGLE_CLIENT_ID);

  if (process.env.NODE_ENV === 'local') {
    await app.listen(5050, '127.0.0.1');
  } else {
    await app.listen(5050, '0.0.0.0');
  }

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
