import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';

import { GoogleOidcGuard } from '@/common/guards/google-oidc.guard';

import { BillingService } from './billing.service';

@Controller('billing')
@UseGuards(GoogleOidcGuard)
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  @Post('dispatch-old')
  async dispatch() {
    await this.billingService.dispatchBillingTasks();
    await this.billingService.dispatchExpireTasks();
    await this.billingService.dispatchCreatePendingTasks();
  }

  @Post('execute-old')
  async executePayment(@Body() body: any) {
    const { subscriptionId } = body;
    this.logger.log(`Processing payment for Subscription: ${subscriptionId}`);
    try {
      await this.billingService.executePayment(subscriptionId);
      this.logger.log(`Payment success for Subscription: ${subscriptionId}`);
      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        `Payment failed for Subscription: ${subscriptionId}`,
        error,
      );
      throw error;
    }
  }

  @Post('expire-old')
  async expireSubscription(@Body() body: any) {
    const { subscriptionId } = body;
    this.logger.log(`Processing expire for Subscription: ${subscriptionId}`);
    try {
      await this.billingService.expireSubscription(subscriptionId);
      this.logger.log(`Expire success for Subscription: ${subscriptionId}`);
      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        `Expire failed for Subscription: ${subscriptionId}`,
        error,
      );
      throw error;
    }
  }

  @Post('create-pending-old')
  async createPendingSubscription(@Body() body: any) {
    const { subscriptionId } = body;
    this.logger.log(
      `Processing create-pending for Subscription: ${subscriptionId}`,
    );
    try {
      await this.billingService.createPendingSubscription(subscriptionId);
      this.logger.log(
        `Create-pending success for Subscription: ${subscriptionId}`,
      );
      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        `Create-pending failed for Subscription: ${subscriptionId}`,
        error,
      );
      throw error;
    }
  }
}
