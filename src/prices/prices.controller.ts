import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PricesService } from './prices.service';
import { Price } from './entities/prices.entity';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { AdminAuthorities } from 'src/auth/decorators/admin-authority.decorator';
import { AdminAuthority } from 'src/utils/constants';

@Controller('productPrice')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  // GET /prices - Price 전체 조회
  @Get()
  async getPrices(): Promise<Price[]> {
    return this.pricesService.getPrices();
  }

  // PATCH /prices - Price 전체 업데이트 (JWT 인증 필요)
  @Patch()
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.EDITOR)
  async patchPrices(@Body() data: Price): Promise<Price> {
    return this.pricesService.patchPrice(data);
  }
}
