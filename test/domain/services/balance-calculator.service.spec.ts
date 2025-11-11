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
  vestings,
}: {
  id: string;
  userId: string;
  amount: number;
  contributedAt: string;
  carencyDate?: string;
  redeemedAmount?: number;
  vestings?: Array<{ id: string; amount: number; releaseAt: string }>;
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
    vestings: vestings?.map((vesting) => ({
      id: vesting.id,
      amount: new Money(vesting.amount),
      releaseAt: new Date(vesting.releaseAt),
    })),
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
      carencyDate: '2024-12-01T00:00:00.000Z',
      vestings: [
        { id: 'v1', amount: 80, releaseAt: '2023-06-01T00:00:00.000Z' },
        { id: 'v2', amount: 120, releaseAt: '2024-12-01T00:00:00.000Z' },
      ],
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
    // c1: vesting v1 liberou 80, v2 ainda não; total liberado 80 - 50 resgatado = 30
    // c2: carência cumprida => 100 disponíveis
    // c3: não liberado pela carência e sem vesting liberado => 0
    expect(available.amount).toBe(130);
  });

  it('retorna o sumário com os saldos total e disponível', () => {
    const summary = service.calculateSummary(contributions, referenceDate);
    expect(summary.total.amount).toBe(350);
    expect(summary.available.amount).toBe(130);
  });

  it('considera liberações parciais adicionais quando carência ainda não expirou', () => {
    const partialReference = new Date('2023-07-01T00:00:00.000Z');

    const available = service.calculateAvailable(
      [
        createContribution({
          id: 'c-partial',
          userId: 'user-1',
          amount: 300,
          contributedAt: '2023-01-01T00:00:00.000Z',
          carencyDate: '2024-01-01T00:00:00.000Z',
          vestings: [
            { id: 'vp1', amount: 100, releaseAt: '2023-06-01T00:00:00.000Z' },
            { id: 'vp2', amount: 100, releaseAt: '2023-12-01T00:00:00.000Z' },
          ],
        }),
      ],
      partialReference,
    );

    expect(available.amount).toBe(100);
  });
});
