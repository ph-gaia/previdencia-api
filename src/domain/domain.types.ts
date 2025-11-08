import { Money } from './value-objects/money.vo';

export enum WithdrawalType {
  TOTAL = 'TOTAL',
  PARTIAL = 'PARTIAL',
}

export interface BalanceSummary {
  total: Money;
  available: Money;
}

