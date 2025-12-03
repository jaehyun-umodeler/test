import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dtos/create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  // @UseGuards(JwtAuthGuard)
  /*@Get()
  async getSubscriptions() {
    return this.subscriptionsService.listSubscriptions();
  } */

  // @UseGuards(JwtAuthGuard)
  /* @Post()
  async createSubscription(@Request() req, @Body() createSubscriptionDto: CreateSubscriptionDto) {
    const userId = req.user.id;
    console.log("userId : ", userId);
    return this.subscriptionsService.createSubscription(
      userId,
      createSubscriptionDto.plan,
      createSubscriptionDto.startDate,
      createSubscriptionDto.endDate,
    );
  } */

  // @UseGuards(JwtAuthGuard)
  /* @Delete(':id')
  async cancelSubscription(@Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(Number(id));
  } */
}