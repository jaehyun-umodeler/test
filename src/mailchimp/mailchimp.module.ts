import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailchimpController } from './mailchimp.controller';
import { MailchimpService } from './mailchimp.service';

@Module({
  imports: [ConfigModule],
  controllers: [MailchimpController],
  providers: [MailchimpService],
  exports: [MailchimpService],
})
export class MailchimpModule {}
