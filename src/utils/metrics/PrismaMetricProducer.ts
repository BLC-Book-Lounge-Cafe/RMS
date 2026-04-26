import {
  AggregationTemporality,
  CollectionResult,
  DataPointType,
  MetricCollectOptions,
  ScopeMetrics,
} from '@opentelemetry/sdk-metrics';
import { emptyResource } from '@opentelemetry/resources';
import { HrTime, ValueType } from '@opentelemetry/api';
import { hrTime } from '@opentelemetry/core';

export class PrismaMetricProducer {
  private client?: any;
  private additionalAttributes = {};

  private readonly startTime: HrTime = hrTime();

  setPrisma(name: string, client: any): void {
    this.client = client;
    this.additionalAttributes = { client: name };
  }

  async collect(_options?: MetricCollectOptions): Promise<CollectionResult> {
    const result: CollectionResult = {
      resourceMetrics: {
        resource: emptyResource(),
        scopeMetrics: [],
      },
      errors: [],
    };
    if (!this.client || !this.client.$metrics) {
      return result;
    }

    const endTime = hrTime();

    const metrics = await this.client.$metrics.json();
    const scopeMetrics: ScopeMetrics = {
      scope: {
        name: 'prisma',
      },
      metrics: [],
    };
    for (const counter of metrics.counters) {
      scopeMetrics.metrics.push({
        descriptor: {
          name: counter.key,
          description: 'Prisma counter',
          unit: '1',
          valueType: ValueType.INT,
        },
        dataPointType: DataPointType.SUM,
        aggregationTemporality: AggregationTemporality.CUMULATIVE,
        dataPoints: [
          {
            startTime: this.startTime,
            endTime: endTime,
            value: counter.value,
            attributes: Object.assign(
              counter.labels,
              this.additionalAttributes,
            ),
          },
        ],
        isMonotonic: true,
      });
    }

    for (const gauge of metrics.gauges) {
      scopeMetrics.metrics.push({
        descriptor: {
          name: gauge.key,
          description: 'Prisma gauge',
          unit: '1',
          valueType: ValueType.INT,
        },
        dataPointType: DataPointType.GAUGE,
        aggregationTemporality: AggregationTemporality.CUMULATIVE,
        dataPoints: [
          {
            startTime: this.startTime,
            endTime: endTime,
            value: gauge.value,
            attributes: Object.assign(gauge.labels, this.additionalAttributes),
          },
        ],
      });
    }

    for (const histogram of metrics.histograms) {
      const boundaries = [];
      const counts = [];
      for (const [boundary, count] of histogram.value.buckets) {
        boundaries.push(boundary);
        counts.push(count);
      }
      scopeMetrics.metrics.push({
        descriptor: {
          name: histogram.key,
          description: 'Prisma histogram',
          unit: 'ms',
          valueType: ValueType.DOUBLE,
        },
        dataPointType: DataPointType.HISTOGRAM,
        aggregationTemporality: AggregationTemporality.CUMULATIVE,
        dataPoints: [
          {
            startTime: this.startTime,
            endTime: endTime,
            value: {
              buckets: {
                boundaries,
                counts,
              },
              count: histogram.value.count,
              sum: histogram.value.sum,
            },
            attributes: Object.assign(
              histogram.labels,
              this.additionalAttributes,
            ),
          },
        ],
      });
    }

    result.resourceMetrics.scopeMetrics.push(scopeMetrics);

    return result;
  }
}
