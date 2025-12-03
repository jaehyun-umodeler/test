import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Price } from './entities/prices.entity';

@Injectable()
export class PricesService {
    constructor(
        @InjectRepository(Price)
        private readonly priceRepository: Repository<Price>,
    ) { }

    async createDefaultPrice(): Promise<Price[]> {
        const count = await this.priceRepository.count();
        if (count === 0) {
            const defaultPrices = [
                { name: 'Pro', monthly: 0, monthlyUSD: 0, yearly: 0, yearlyUSD: 0, discount: 0 },
                { name: 'Personal', monthly: 0, monthlyUSD: 0, yearly: 0, yearlyUSD: 0, discount: 0 },
                { name: 'ArtPass', monthly: 0, monthlyUSD: 0, yearly: 0, yearlyUSD: 0, discount: 0 },
                { name: 'All-In-One', monthly: 0, monthlyUSD: 0, yearly: 0, yearlyUSD: 0, discount: 0 },
            ];
            const prices = defaultPrices.map((price) => this.priceRepository.create(price));
            await this.priceRepository.save(prices);
            return prices;
        }
        return [];
    }

    // 전체 Price 조회
    async getPrices(): Promise<Price[]> {
        return this.priceRepository
            .createQueryBuilder('price')
            .orderBy(`FIELD(price.name, 'Pro', 'ArtPass', 'All-In-One')`)
            .getMany();
    }

    async patchPrices(prices: Price[]): Promise<Price[]> {
        for (const price of prices) {
            const existing = await this.priceRepository.findOne({ where: { name: price.name } });
            if (existing) {
                Object.assign(existing, price);
                await this.priceRepository.save(existing);
            } else {
                // 존재하지 않는 경우 insert하지 않음.
            }
        }
        return this.priceRepository.find();
    }

    async patchPrice(price: Price): Promise<Price> {
        const existing = await this.priceRepository.findOne({ where: { name: price.name } });
        if (existing) {
            return await this.priceRepository.save(price);
        } else {
        }

        return null;
    }
}