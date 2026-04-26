import { api, NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { PrismaMetricProducer } from './utils/metrics/PrismaMetricProducer';

export const prismaRmsProducer = new PrismaMetricProducer();

export function setupOtel() {
  api.propagation.setGlobalPropagator(new B3Propagator());

  const prometheusExporter = new PrometheusExporter({
    endpoint: 'metrics',
    port: 9000,
  });

  const sdk = new NodeSDK({
    serviceName: 'rms',
    metricReader: prometheusExporter,
    contextManager: new AsyncLocalStorageContextManager(),
    instrumentations: [
      new RuntimeNodeInstrumentation({
        monitoringPrecision: 5000,
      }),
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new NestInstrumentation(),
      new PrismaInstrumentation(),
      new PinoInstrumentation(),
    ],
  });

  sdk.start();
}
