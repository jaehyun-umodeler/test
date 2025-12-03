import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mailchimp from '@mailchimp/mailchimp_marketing';
import * as crypto from 'crypto';

@Injectable()
export class MailchimpService {
  private readonly logger = new Logger(MailchimpService.name);
  private readonly listId: string;

  constructor(private configService: ConfigService) {
    this.listId = this.configService.get('mailchimp.listId') || 'c029f330a5';

    mailchimp.setConfig({
      apiKey: this.configService.get('mailchimp.apiKey') || 'd81fce988f51de6bda17cc54b26e8c2e',
      server: this.configService.get('mailchimp.server') || 'us19',
    });
  }

  /**
   * 메일침프에서 이메일 주소의 구독 상태를 확인
   * @param email 이메일 주소
   * @returns 구독 상태 또는 null
   */
  async getMemberStatus(email: string): Promise<string | null> {
    try {
      const member = await this.findMemberByEmail(email);

      if (!member) {
        return null;
      }

      return member.status;
    } catch (error) {
      this.logger.error(`Failed to get member status for ${email}: ${error}`);
      
      return null;
    }
  }

  /**
   * 메일침프에서 멤버를 생성 또는 업데이트
   * @param email 이메일 주소
   * @param options 업데이트 옵션
   * @param options.subscriptionStatus 구독 상태
   * @param options.language 언어
   * @param options.addDeletedTags 삭제 태그 추가 여부
   * @returns 멤버 정보 객체 또는 null
   */
  async updateMember(
    email: string,
    options: {
      subscriptionStatus?: boolean;
      language?: string;
      addDeletedTags?: boolean;
    }
  ): Promise<boolean> {
    try {
      let member = await this.findMemberByEmail(email);
      const subscriberHash = crypto
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex');

      if (!member) {
        member = await mailchimp.lists.setListMember(this.listId, subscriberHash, {
          email_address: email,
          status_if_new: options.subscriptionStatus ? 'subscribed' : 'unsubscribed',
        });

        this.logger.log(`New member created in Mailchimp: ${email} (${options.subscriptionStatus ? 'subscribed' : 'unsubscribed'})`);
      } else if (options.subscriptionStatus !== undefined) {
        await mailchimp.lists.updateListMember(this.listId, subscriberHash, {
          status: options.subscriptionStatus ? 'subscribed' : 'unsubscribed',
        });

        this.logger.log(`Member subscription status updated for ${email} (${options.subscriptionStatus ? 'subscribed' : 'unsubscribed'})`);
      }

      if (options.language) {
        await mailchimp.lists.updateListMemberTags(this.listId, subscriberHash, {
          tags: options.language === 'en' ? [
            { name: 'lang_en', status: 'active' },
            { name: 'saas_yes', status: 'active' },
            { name: 'lang_ko', status: 'inactive' },
          ] : [
            { name: 'lang_ko', status: 'active' },
            { name: 'saas_yes', status: 'active' },
            { name: 'lang_en', status: 'inactive' },
          ],
        });

        this.logger.log(`Language tags updated for ${email} (${options.language})`);
      }

      if (options.addDeletedTags) {
        await mailchimp.lists.updateListMemberTags(this.listId, subscriberHash, {
          tags: [
            { name: 'saas_no', status: 'active' },
            { name: 'saas_yes', status: 'inactive' },
          ]
        });

        this.logger.log(`Deleted tags added for ${email} (${options.addDeletedTags ? 'true' : 'false'})`);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to update member ${email}: ${error}`);
      
      return false;
    }
  }

  /**
   * 메일침프에서 이메일 주소로 멤버 검색
   * @param email 이메일 주소
   * @returns 멤버 정보 객체 또는 null
   */
  private async findMemberByEmail(email: string): Promise<{ status: string; list_id: string } | null> {
    try {
      const response = await mailchimp.searchMembers.search(email);

      return response.exact_matches.members[0] || null;
    } catch (error) {
      this.logger.error(`Failed to search member with email ${email}: ${error}`);
      
      return null;
    }
  }
}
