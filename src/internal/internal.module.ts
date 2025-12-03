import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    BillingModule,
    RouterModule.register([
      {
        path: 'internal',
        children: [
          {
            path: '',
            module: BillingModule,
          },
        ],
      },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class InternalModule {}
