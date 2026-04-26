import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { trace } from '@opentelemetry/api';
import { InternalError } from './filter.errors';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: Error, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const getHttpResp =
      exception instanceof HttpException
        ? exception.getResponse()
        : InternalError;
    const responseBody = {
      error: getHttpResp,
    };

    this.logError(exception);
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private logError(exception: Error) {
    const spanContext = trace.getActiveSpan()?.spanContext();

    Logger.error({
      message: 'thrown exception',
      error: {
        message: exception.message,
        type: exception.name,
        stack_trace: exception.stack,
      },
      trace: {
        id: spanContext?.traceId,
      },
      span: {
        id: spanContext?.spanId,
      },
    });
  }
}
