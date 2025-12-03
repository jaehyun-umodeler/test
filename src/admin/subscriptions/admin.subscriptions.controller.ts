import {
  Controller,
  UseGuards,
  Param,
  Get,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { AdminAuthorities } from 'src/auth/decorators/admin-authority.decorator';
import { AdminAuthority } from 'src/utils/constants';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';

@UseGuards(JwtAccessAuthGuard)
@Controller('subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get(':id')
  @AdminAuthorities(AdminAuthority.VIEWER)
  async get(@Param('id') id: number) {
    return this.subscriptionsService.getSubscriptionById(id);
  }

  @Post(':id/unsubscribe')
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribeSubscription(@Param('id') id: number) {
    await this.subscriptionsService.unsubscribeSubscription(id);
  }

  @Post(':id/cancel-unsubscribe')
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelUnsubscribe(@Param('id') id: number) {
    await this.subscriptionsService.cancelUnsubscribe(id);
  }
}
