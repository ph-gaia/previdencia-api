import { GetBalanceUseCase } from '../../src/application/use-cases/get-balance.use-case';
import { UserRepository } from '../../src/domain/repositories/user-repository.interface';
import { ContributionRepository } from '../../src/domain/repositories/contribution-repository.interface';
import { User } from '../../src/domain/entities/user.entity';
import { Contribution } from '../../src/domain/entities/contribution.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import { CarencyDate } from '../../src/domain/value-objects/carency-date.vo';

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  add(user: User): void {
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
    await Promise.all(
      contributions.map((contribution) => this.save(contribution)),
    );
  }
}

const createUser = (id: string): User =>
  new User({
    id,
    fullName: 'John Doe',
    document: '12345678900',
    birthDate: new Date('1990-01-01T00:00:00.000Z'),
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
    carencyDate: carencyDate
      ? new CarencyDate(new Date(carencyDate))
      : undefined,
  });

describe('GetBalanceUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let contributionRepository: InMemoryContributionRepository;
  let useCase: GetBalanceUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    contributionRepository = new InMemoryContributionRepository();
    useCase = new GetBalanceUseCase(userRepository, contributionRepository);
  });

  it('retorna o saldo total e disponível do usuário', async () => {
    const user = createUser('user-1');
    userRepository.add(user);

    const contributions = [
      createContribution('c1', user.getId(), 100, '2023-01-01T00:00:00.000Z'),
      createContribution(
        'c2',
        user.getId(),
        200,
        '2023-01-01T00:00:00.000Z',
        '2025-01-01T00:00:00.000Z',
      ),
    ];
    await contributionRepository.addMany(contributions);

    const result = await useCase.execute({
      userId: user.getId(),
      referenceDate: '2024-01-01T00:00:00.000Z',
    });

    expect(result).toEqual({
      userId: user.getId(),
      total: 300,
      available: 100,
    });
  });

  it('lança erro quando o usuário não existe', async () => {
    await expect(
      useCase.execute({ userId: 'non-existent-user' }),
    ).rejects.toThrow('User not found');
  });

  it('lança erro quando a data de referência é inválida', async () => {
    const user = createUser('user-1');
    userRepository.add(user);

    await expect(
      useCase.execute({
        userId: user.getId(),
        referenceDate: 'invalid-date',
      }),
    ).rejects.toThrow('Invalid reference date');
  });
});
