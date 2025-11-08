import { RequestWithdrawalUseCase } from '../../src/application/use-cases/request-withdrawal.use-case';
import { UserRepository } from '../../src/domain/repositories/user-repository.interface';
import { ContributionRepository } from '../../src/domain/repositories/contribution-repository.interface';
import { User } from '../../src/domain/entities/user.entity';
import { Contribution } from '../../src/domain/entities/contribution.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import { CarencyDate } from '../../src/domain/value-objects/carency-date.vo';
import { WithdrawalType } from '../../src/domain/domain.types';
import { InsufficientBalanceException } from '../../src/domain/exceptions/insufficient-balance.exception';
import { InvalidWithdrawalException } from '../../src/domain/exceptions/invalid-withdrawal.exception';

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  set(user: User): void {
    this.users.set(user.getId(), user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.getId(), user);
  }
}

class InMemoryContributionRepository implements ContributionRepository {
  private contributions = new Map<string, Contribution>();

  async findById(id: string): Promise<Contribution | null> {
    return this.contributions.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Contribution[]> {
    return Array.from(this.contributions.values()).filter(
      (contribution) => contribution.getUserId() === userId,
    );
  }

  async save(contribution: Contribution): Promise<void> {
    this.contributions.set(contribution.getId(), contribution);
  }

  async addMany(contributions: Contribution[]): Promise<void> {
    await Promise.all(contributions.map((contribution) => this.save(contribution)));
  }
}

const createUser = (id: string): User =>
  new User({
    id,
    fullName: 'Jane Doe',
    document: '98765432100',
    birthDate: new Date('1990-05-01T00:00:00.000Z'),
  });

const createContribution = (
  id: string,
  userId: string,
  amount: number,
  contributedAt: string,
  carencyDate?: string,
): Contribution =>
  new Contribution({
    id,
    userId,
    amount: new Money(amount),
    contributedAt: new Date(contributedAt),
    carencyDate: carencyDate ? new CarencyDate(new Date(carencyDate)) : undefined,
  });

describe('RequestWithdrawalUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let contributionRepository: InMemoryContributionRepository;
  let useCase: RequestWithdrawalUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    contributionRepository = new InMemoryContributionRepository();
    useCase = new RequestWithdrawalUseCase(userRepository, contributionRepository);
  });

  it('aprova um resgate parcial e retorna saldo restante', async () => {
    const user = createUser('user-1');
    userRepository.set(user);

    const contributions = [
      createContribution('c1', user.getId(), 300, '2023-01-01T00:00:00.000Z'),
      createContribution('c2', user.getId(), 200, '2023-02-01T00:00:00.000Z'),
    ];
    await contributionRepository.addMany(contributions);

    const result = await useCase.execute({
      userId: user.getId(),
      type: WithdrawalType.PARTIAL,
      requestedAmount: 250,
      requestId: 'req-123',
      requestedAt: '2024-03-01T00:00:00.000Z',
      notes: 'partial withdrawal',
    });

    expect(result).toEqual({
      requestId: 'req-123',
      userId: user.getId(),
      type: WithdrawalType.PARTIAL,
      approvedAmount: 250,
      availableBalanceAfterRequest: 250,
      requestedAt: '2024-03-01T00:00:00.000Z',
      notes: 'partial withdrawal',
    });
  });

  it('aprova um resgate total utilizando o saldo disponível', async () => {
    const user = createUser('user-1');
    userRepository.set(user);

    const contributions = [
      createContribution('c1', user.getId(), 400, '2023-01-01T00:00:00.000Z'),
    ];
    await contributionRepository.addMany(contributions);

    const result = await useCase.execute({
      userId: user.getId(),
      type: WithdrawalType.TOTAL,
      requestedAt: '2024-04-01T00:00:00.000Z',
    });

    expect(result.userId).toBe(user.getId());
    expect(result.type).toBe(WithdrawalType.TOTAL);
    expect(result.approvedAmount).toBe(400);
    expect(result.availableBalanceAfterRequest).toBe(0);
    expect(result.requestedAt).toBe('2024-04-01T00:00:00.000Z');
    expect(result.requestId).toMatch(/^wr_/);
  });

  it('lança erro quando o usuário não existe', async () => {
    await expect(
      useCase.execute({
        userId: 'invalid-user',
        type: WithdrawalType.TOTAL,
      }),
    ).rejects.toThrow('User not found');
  });

  it('lança erro quando existem contribuições de outro usuário', async () => {
    const user = createUser('user-1');
    userRepository.set(user);

    const otherContribution = createContribution(
      'c-other',
      'user-2',
      100,
      '2023-01-01T00:00:00.000Z',
    );

    const mismatchingContributionRepository: ContributionRepository = {
      findById: async () => otherContribution,
      findByUserId: async () => [otherContribution],
      save: async () => undefined,
    };

    const useCaseWithInvalidData = new RequestWithdrawalUseCase(
      userRepository,
      mismatchingContributionRepository,
    );

    await expect(
      useCaseWithInvalidData.execute({
        userId: user.getId(),
        type: WithdrawalType.TOTAL,
      }),
    ).rejects.toBeInstanceOf(InvalidWithdrawalException);
  });

  it('impede resgates acima do saldo disponível', async () => {
    const user = createUser('user-1');
    userRepository.set(user);

    const contribution = createContribution('c1', user.getId(), 100, '2023-01-01T00:00:00.000Z');
    await contributionRepository.save(contribution);

    await expect(
      useCase.execute({
        userId: user.getId(),
        type: WithdrawalType.PARTIAL,
        requestedAmount: 150,
      }),
    ).rejects.toBeInstanceOf(InsufficientBalanceException);
  });
});

