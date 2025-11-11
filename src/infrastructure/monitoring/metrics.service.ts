import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Counter, Registry, collectDefaultMetrics } from 'prom-client';

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

export type MetricsStatus = 'success' | 'error';

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private readonly registry: Registry;
  private readonly balanceReadsCounter: Counter<'status'>;
  private readonly withdrawalRequestsCounter: Counter<'status'>;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({ app: 'previdencia-api' });
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'previdencia_',
    });

    this.balanceReadsCounter = new Counter({
      name: 'previdencia_balance_reads_total',
      help: 'Total de leituras de saldo processadas pela API',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.withdrawalRequestsCounter = new Counter({
      name: 'previdencia_withdrawal_requests_total',
      help: 'Total de solicitações de resgate processadas pela API',
      labelNames: ['status'],
      registers: [this.registry],
    });
  }

  observeBalanceRead(status: MetricsStatus): void {
    this.balanceReadsCounter.inc({ status });
  }

  observeWithdrawalRequest(status: MetricsStatus): void {
    this.withdrawalRequestsCounter.inc({ status });
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  shutdown(): void {
    // no-op placeholder to manter compatibilidade com testes
  }

  onModuleDestroy(): void {
    this.shutdown();
  }
}
