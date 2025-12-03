import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Price } from './entities/prices.entity';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Price])],
  providers: [PricesService],
  controllers: [PricesController],
  exports: [PricesService],
})
export class PricesModule {}