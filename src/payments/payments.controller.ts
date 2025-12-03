import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // @UseGuards(JwtAuthGuard)
  /* @Get()
  async getPayments() {
    return this.paymentsService.listPayments();
  } */

  // @UseGuards(JwtAuthGuard)
  /* @Post()
  async createPayment(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    const userId = req.user.id;
    return this.paymentsService.createPayment(
      userId,
      createPaymentDto.amount,
      createPaymentDto.status,
      createPaymentDto.paymentDate,
    );
  } */

  // @UseGuards(JwtAuthGuard)
  /* @Delete(':id')
  async cancelPayment(@Param('id') id: string) {
    return this.paymentsService.cancelPayment(Number(id));
  } */
}