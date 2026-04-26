import { Response, NextFunction, Request } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { api } from '@opentelemetry/sdk-node';
import { trace } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const requestStartTime = new Date().getTime();
    const tracer = api.trace.getTracer('tracer');

    tracer.startActiveSpan('next-span', () => {
      const send = response.send;

      response.send = (respBody) => {
        const bodyAsString = respBody?.toString();
        const spanContext = trace.getActiveSpan()?.spanContext();

        Logger.log({
          url: {
            path: request.path,
            query: JSON.stringify(request.query),
          },
          http: {
            request: {
              id: this.getReqId(request),
              headers: request.headers,
              method: request.method,
              body: {
                content: JSON.stringify(request.body),
              },
            },
            response: {
              latency_ms: new Date().getTime() - requestStartTime,
              status_code: response.statusCode,
              headers: response.getHeaders(),
              body: {
                content: bodyAsString,
              },
            },
          },
          trace: {
            id: spanContext?.traceId,
          },
          span: {
            id: spanContext?.spanId,
          },
        });
        response.send = send;

        return response.send(bodyAsString);
      };

      next();
    });
  }

  private getReqId(request: Request) {
    return request.headers['x-request-id'] || uuidv4();
  }
}
