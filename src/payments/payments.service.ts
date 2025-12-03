import { Injectable, NotFoundException } from '@nestjs/common';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async listPayments() {
    return this.paymentRepository.find({ relations: ['user'] });
  }

  async createPayment(userId: number, amount: number, status: PaymentStatus, paymentDate: Date) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const payment = this.paymentRepository.create({
      user,
      amount,
      status,
      paymentDate,
    });
    return this.paymentRepository.save(payment);
  }

  async cancelPayment(id: number) {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    await this.paymentRepository.remove(payment);
    return { message: 'Payment cancelled successfully' };
  }
}