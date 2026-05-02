import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard } from '@guards/auth.guard';
import { DatabaseRmsModule } from '@clients/database/database-rms.module';
import { QuickReservationsModule } from '@modules/quick-reservations.module';
import { BookReservationsModule } from '@modules/book-reservations.module';
import { TableReservationsModule } from '@modules/table-reservations.module';
import { LoggerModule } from 'nestjs-pino';
import { OpenTelemetryModule } from 'nestjs-otel';
import pretty from 'pino-pretty';
import ecsFormat from '@elastic/ecs-pino-format';
import { LoggerMiddleware } from './middleware/logger.middleware';

const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true,
    apiMetrics: {
      enable: true,
      ignoreRoutes: ['/swaggerui'],
      ignoreUndefinedRoutes: true,
    },
  },
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseRmsModule,
    QuickReservationsModule,
    BookReservationsModule,
    TableReservationsModule,
    OpenTelemetryModuleConfig,
    LoggerModule.forRoot({
      pinoHttp:
        process.env.NODE_ENV !== 'production'
          ? [
              {
                autoLogging: false,
                serializers: {
                  req() {},
                },
              },
              pretty(),
            ]
          : {
              autoLogging: false,
              serializers: {
                req() {},
              },
              ...ecsFormat(),
            },
    }),
  ],
  providers: [
    AuthGuard,
    {
      provide: APP_GUARD,
      useExisting: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
