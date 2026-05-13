import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as PrismaRmsClient } from '@prisma-rms/client';
import { trace } from '@opentelemetry/api';
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
    this.client = new PrismaRmsClient({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'error' },
      ],
    });

    this.subscribeToPrismaEvents();

    await this.client.$connect();
    prismaRmsProducer.setPrisma('rms', this.client);
    this.logger.log('Connected to RMS PostgreSQL database');
  }

  getClient(): PrismaRmsClient {
    return this.client;
  }

  private subscribeToPrismaEvents(): void {
    const client = this.client as unknown as {
      $on: (event: string, listener: (payload: unknown) => void) => void;
    };

    client.$on('query', (payload) => {
      const e = payload as {
        query: string;
        params: string;
        duration: number;
      };
      this.logger.log({
        message: 'prisma.query',
        db: {
          statement: e.query,
          params: e.params,
          duration_ms: e.duration,
        },
        ...this.traceContext(),
      });
    });

    client.$on('info', (payload) => {
      const e = payload as { message: string };
      this.logger.log({
        message: 'prisma.info',
        detail: e.message,
        ...this.traceContext(),
      });
    });

    client.$on('warn', (payload) => {
      const e = payload as { message: string };
      this.logger.warn({
        message: 'prisma.warn',
        detail: e.message,
        ...this.traceContext(),
      });
    });

    client.$on('error', (payload) => {
      const e = payload as { message: string };
      this.logger.error({
        message: 'prisma.error',
        detail: e.message,
        ...this.traceContext(),
      });
    });
  }

  private traceContext(): {
    trace?: { id: string };
    span?: { id: string };
  } {
    const ctx = trace.getActiveSpan()?.spanContext();
    if (!ctx) return {};
    return {
      trace: { id: ctx.traceId },
      span: { id: ctx.spanId },
    };
  }
}
