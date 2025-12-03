import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly webhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
  }

  async sendAlert(title: string, message: string, color: string = '#ff0000') {
    if (process.env.NODE_ENV !== 'production' || !this.webhookUrl) {
      return;
    }
    const payload = {
      attachments: [
        {
          title: title,
          text: message,
          color: color,
          fields: [
            {
              title: 'Environment',
              value: process.env.NODE_ENV || 'development',
              short: true,
            },
            {
              title: 'Time',
              value: new Date().toLocaleString(),
              short: true,
            },
          ],
        },
      ],
    };

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      this.logger.error('Slack Failed', error);
    }
  }
}
