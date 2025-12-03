import { Injectable, OnModuleDestroy, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleDestroy, OnApplicationShutdown {
  constructor(private readonly dataSource: DataSource) {}

  async closeConnection() {
    console.log('🔥 Closing database connection...');
    await this.dataSource.destroy();
  }

  async onModuleDestroy() {
    await this.closeConnection();
  }

  async onApplicationShutdown(signal?: string) {
    console.log(`🔥 DatabaseService shutdown due to ${signal}`);
    await this.closeConnection();
  }
}