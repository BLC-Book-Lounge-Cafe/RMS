import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as PrismaRmsClient } from '@prisma-rms/client';
import { prismaRmsProducer } from '@telemetry';

@Injectable()
export class DatabaseRmsClient implements OnModuleInit {
  private client: PrismaRmsClient;
  private readonly logger = new Logger(DatabaseRmsClient.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const connectionString = this.configService.get<string>('RMS_DATABASE_URL');

    if (!connectionString) {
      throw new Error('RMS_DATABASE_URL is not defined');
    }

    const adapter = new PrismaPg({ connectionString });
    this.client = new PrismaRmsClient({ adapter });

    await this.client.$connect();
    prismaRmsProducer.setPrisma('rms', this.client);
    this.logger.log('Connected to RMS PostgreSQL database');
  }

  getClient(): PrismaRmsClient {
    return this.client;
  }
}
