import { BalanceCalculatorService } from '../../../src/domain/services/balance-calculator.service';
import { Contribution } from '../../../src/domain/entities/contribution.entity';
import { Money } from '../../../src/domain/value-objects/money.vo';
import { CarencyDate } from '../../../src/domain/value-objects/carency-date.vo';

const createContribution = ({
  id,
  userId,
  amount,
  contributedAt,
  carencyDate,
  redeemedAmount,
}: {
  id: string;
  userId: string;
  amount: number;
  contributedAt: string;
  carencyDate?: string;
  redeemedAmount?: number;
}): Contribution =>
  new Contribution({
    id,
    userId,
    amount: new Money(amount),
    contributedAt: new Date(contributedAt),
    carencyDate: carencyDate
      ? new CarencyDate(new Date(carencyDate))
      : undefined,
    redeemedAmount:
      redeemedAmount !== undefined ? new Money(redeemedAmount) : undefined,
  });

describe('BalanceCalculatorService', () => {
  const service = new BalanceCalculatorService();
  const referenceDate = new Date('2024-06-01T00:00:00.000Z');

  const contributions = [
    createContribution({
      id: 'c1',
      userId: 'user-1',
      amount: 200,
      contributedAt: '2023-01-01T00:00:00.000Z',
      redeemedAmount: 50,
    }),
    createContribution({
      id: 'c2',
      userId: 'user-1',
      amount: 100,
      contributedAt: '2023-06-01T00:00:00.000Z',
      carencyDate: '2023-12-01T00:00:00.000Z',
    }),
    createContribution({
      id: 'c3',
      userId: 'user-1',
      amount: 50,
      contributedAt: '2024-01-01T00:00:00.000Z',
      carencyDate: '2025-01-01T00:00:00.000Z',
    }),
  ];

  it('soma corretamente os valores totais das contribuições', () => {
    const total = service.calculateTotal(contributions);
    expect(total.amount).toBe(350);
  });

  it('considera carência e resgates ao calcular saldo disponível', () => {
    const available = service.calculateAvailable(contributions, referenceDate);
    expect(available.amount).toBe(250);
  });

  it('retorna o sumário com os saldos total e disponível', () => {
    const summary = service.calculateSummary(contributions, referenceDate);
    expect(summary.total.amount).toBe(350);
    expect(summary.available.amount).toBe(250);
  });
});
