import { WithdrawalValidatorService } from '../../../src/domain/services/withdrawal-validator.service';
import { BalanceCalculatorService } from '../../../src/domain/services/balance-calculator.service';
import { Contribution } from '../../../src/domain/entities/contribution.entity';
import { WithdrawalRequest } from '../../../src/domain/entities/withdrawal-request.entity';
import { WithdrawalType } from '../../../src/domain/domain.types';
import { Money } from '../../../src/domain/value-objects/money.vo';
import { CarencyDate } from '../../../src/domain/value-objects/carency-date.vo';
import { InsufficientBalanceException } from '../../../src/domain/exceptions/insufficient-balance.exception';
import { InvalidWithdrawalException } from '../../../src/domain/exceptions/invalid-withdrawal.exception';

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

const createWithdrawalRequest = ({
  id = 'withdrawal-1',
  userId,
  type,
  requestedAmount,
  requestedAt,
}: {
  id?: string;
  userId: string;
  type: WithdrawalType;
  requestedAmount?: number;
  requestedAt: string;
}): WithdrawalRequest =>
  new WithdrawalRequest({
    id,
    userId,
    type,
    requestedAt: new Date(requestedAt),
    requestedAmount:
      requestedAmount !== undefined ? new Money(requestedAmount) : undefined,
  });

describe('WithdrawalValidatorService', () => {
  const balanceCalculator = new BalanceCalculatorService();
  const service = new WithdrawalValidatorService(balanceCalculator);
  const referenceDate = new Date('2024-06-01T00:00:00.000Z');

  const baseContributions = [
    createContribution({
      id: 'c1',
      userId: 'user-1',
      amount: 200,
      contributedAt: '2023-01-01T00:00:00.000Z',
      redeemedAmount: 50,
      carencyDate: '2024-12-01T00:00:00.000Z',
      vestings: [
        { id: 'v1', amount: 80, releaseAt: '2023-06-01T00:00:00.000Z' },
        { id: 'v2', amount: 70, releaseAt: '2024-12-01T00:00:00.000Z' },
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

  it('retorna todo o saldo disponível para resgates totais', () => {
    const request = createWithdrawalRequest({
      userId: 'user-1',
      type: WithdrawalType.TOTAL,
      requestedAt: referenceDate.toISOString(),
    });

    const amount = service.validate(request, baseContributions, referenceDate);
    expect(amount.amount).toBe(130);
  });

  it('retorna o valor solicitado para resgates parciais válidos', () => {
    const request = createWithdrawalRequest({
      userId: 'user-1',
      type: WithdrawalType.PARTIAL,
      requestedAmount: 120,
      requestedAt: referenceDate.toISOString(),
    });

    const amount = service.validate(request, baseContributions, referenceDate);
    expect(amount.amount).toBe(120);
  });

  it('lança erro quando contribuições pertencem a outro usuário', () => {
    const request = createWithdrawalRequest({
      userId: 'user-1',
      type: WithdrawalType.TOTAL,
      requestedAt: referenceDate.toISOString(),
    });

    const contributions = [
      createContribution({
        id: 'c1',
        userId: 'user-2',
        amount: 100,
        contributedAt: '2023-01-01T00:00:00.000Z',
      }),
    ];

    expect(() =>
      service.validate(request, contributions, referenceDate),
    ).toThrow(InvalidWithdrawalException);
  });

  it('lança erro quando saldo disponível é zero', () => {
    const request = createWithdrawalRequest({
      userId: 'user-1',
      type: WithdrawalType.TOTAL,
      requestedAt: referenceDate.toISOString(),
    });

    const contributions = [
      createContribution({
        id: 'c1',
        userId: 'user-1',
        amount: 100,
        contributedAt: '2023-01-01T00:00:00.000Z',
        redeemedAmount: 100,
      }),
      createContribution({
        id: 'c2',
        userId: 'user-1',
        amount: 100,
        contributedAt: '2024-05-01T00:00:00.000Z',
        carencyDate: '2025-05-01T00:00:00.000Z',
      }),
    ];

    expect(() =>
      service.validate(request, contributions, referenceDate),
    ).toThrow(InsufficientBalanceException);
  });

  it('lança erro quando resgate parcial não informa valor', () => {
    const request = createWithdrawalRequest({
      userId: 'user-1',
      type: WithdrawalType.PARTIAL,
      requestedAt: referenceDate.toISOString(),
    });

    expect(() =>
      service.validate(request, baseContributions, referenceDate),
    ).toThrow(InvalidWithdrawalException);
  });

  it('lança erro quando valor do resgate parcial excede saldo disponível', () => {
    const request = createWithdrawalRequest({
      userId: 'user-1',
      type: WithdrawalType.PARTIAL,
      requestedAmount: 500,
      requestedAt: referenceDate.toISOString(),
    });

    expect(() =>
      service.validate(request, baseContributions, referenceDate),
    ).toThrow(InsufficientBalanceException);
  });
});
