import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { ContributionOrmEntity } from '../entities/contribution.orm-entity';
import { ContributionVestingOrmEntity } from '../entities/contribution-vesting.orm-entity';
import { WithdrawalOrmEntity } from '../entities/withdrawal.orm-entity';
import { WithdrawalItemOrmEntity } from '../entities/withdrawal-item.orm-entity';
import { UserBalanceOrmEntity } from '../entities/user-balance.orm-entity';

export interface SeedContribution {
  id?: string;
  userId: string;
  amount: number;
  contributedAt: Date;
  carencyDate?: Date | null;
  vestings?: Array<{ releaseAt: Date; amount: number }>;
  redeemedAmount?: number;
}

export interface SeedWithdrawalItem {
  contributionId?: string;
  contributionRef?: { userId: string; contributedAt: Date };
  amount: number;
}

export interface SeedWithdrawal {
  id?: string;
  userId: string;
  type: 'TOTAL' | 'PARTIAL';
  requestedAmount?: number;
  requestedAt: Date;
  processedAt?: Date;
  items: SeedWithdrawalItem[];
}

export interface SeedBalance {
  userId: string;
  totalAmount: number;
  availableAmount: number;
  lockedAmount: number;
  calculatedAt?: Date;
}

export interface SeedUser {
  id: string;
  fullName: string;
  document: string;
  birthDate: Date;
}

export interface SeedData {
  users: SeedUser[];
  contributions: SeedContribution[];
  withdrawals?: SeedWithdrawal[];
  balances?: SeedBalance[];
}

export async function runSeed(
  dataSource: DataSource,
  seedData?: SeedData,
): Promise<void> {
  const usersRepo = dataSource.getRepository(UserOrmEntity);
  const contributionsRepo = dataSource.getRepository(ContributionOrmEntity);
  const vestingsRepo = dataSource.getRepository(ContributionVestingOrmEntity);
  const withdrawalsRepo = dataSource.getRepository(WithdrawalOrmEntity);
  const withdrawalItemsRepo = dataSource.getRepository(WithdrawalItemOrmEntity);
  const balancesRepo = dataSource.getRepository(UserBalanceOrmEntity);

  const seed = seedData ?? defaultSeedData();

  await dataSource.transaction(async (manager) => {
    const userEntities = seed.users.map((user) => {
      const entity = new UserOrmEntity();
      entity.id = user.id;
      entity.fullName = user.fullName;
      entity.document = user.document;
      entity.birthDate = user.birthDate;
      return entity;
    });
    await manager.save(usersRepo.target, userEntities);

    const contributionEntities = seed.contributions.map((contribution) => {
      const contributionId = contribution.id ?? randomUUID();
      const entity = new ContributionOrmEntity();
      entity.id = contributionId;
      entity.userId = contribution.userId;
      entity.amount = contribution.amount;
      entity.redeemedAmount = contribution.redeemedAmount ?? 0;
      entity.contributedAt = contribution.contributedAt;
      entity.carencyDate = contribution.carencyDate ?? null;
      contribution.id = contributionId;
      return entity;
    });
    await manager.save(contributionsRepo.target, contributionEntities);

    const contributionLookup = new Map<string, ContributionOrmEntity>();
    for (const entity of contributionEntities) {
      contributionLookup.set(
        `${entity.userId}-${entity.contributedAt.toISOString()}`,
        entity,
      );
    }

    const vestingEntities: ContributionVestingOrmEntity[] = [];
    for (const contribution of seed.contributions) {
      if (!contribution.vestings?.length) {
        continue;
      }

      if (!contribution.id) {
        continue;
      }

      for (const vesting of contribution.vestings) {
        const entity = new ContributionVestingOrmEntity();
        entity.id = randomUUID();
        entity.contributionId = contribution.id;
        entity.releaseAt = vesting.releaseAt;
        entity.amount = vesting.amount;
        vestingEntities.push(entity);
      }
    }
    if (vestingEntities.length > 0) {
      await manager.save(vestingsRepo.target, vestingEntities);
    }

    if (seed.withdrawals?.length) {
      for (const withdrawal of seed.withdrawals) {
        const withdrawalId = withdrawal.id ?? randomUUID();
        withdrawal.id = withdrawalId;

        const withdrawalEntity = new WithdrawalOrmEntity();
        withdrawalEntity.id = withdrawalId;
        withdrawalEntity.userId = withdrawal.userId;
        withdrawalEntity.type = withdrawal.type;
        withdrawalEntity.requestedAmount = withdrawal.requestedAmount;
        withdrawalEntity.status = 'PROCESSED';
        withdrawalEntity.requestedAt = withdrawal.requestedAt;
        withdrawalEntity.processedAt =
          withdrawal.processedAt ?? withdrawal.requestedAt;
        await manager.save(withdrawalsRepo.target, withdrawalEntity);

        for (const item of withdrawal.items) {
          const targetContributionId =
            item.contributionId ??
            contributionLookup.get(
              `${withdrawal.userId}-${item.contributionRef?.contributedAt.toISOString()}`,
            )?.id;

          if (!targetContributionId) {
            continue;
          }

          const withdrawalItem = new WithdrawalItemOrmEntity();
          withdrawalItem.id = randomUUID();
          withdrawalItem.withdrawalId = withdrawalId;
          withdrawalItem.contributionId = targetContributionId;
          withdrawalItem.amount = item.amount;
          await manager.save(withdrawalItemsRepo.target, withdrawalItem);
        }
      }
    }

    if (seed.balances?.length) {
      const balanceEntities = seed.balances.map((balance) => {
        const entity = new UserBalanceOrmEntity();
        entity.userId = balance.userId;
        entity.totalAmount = balance.totalAmount;
        entity.availableAmount = balance.availableAmount;
        entity.lockedAmount = balance.lockedAmount;
        entity.calculatedAt = balance.calculatedAt ?? new Date();
        return entity;
      });
      await manager.save(balancesRepo.target, balanceEntities);
    }
  });
}

function defaultSeedData(): SeedData {
  const now = new Date();
  const user1 = {
    id: randomUUID(),
    fullName: 'Alice Rodrigues',
    document: '11122233344',
    birthDate: new Date('1988-02-15T00:00:00.000Z'),
  };
  const user2 = {
    id: randomUUID(),
    fullName: 'Bruno Martins',
    document: '55566677788',
    birthDate: new Date('1992-07-20T00:00:00.000Z'),
  };

  const contribution1: SeedContribution = {
    userId: user1.id,
    amount: 2500,
    redeemedAmount: 500,
    contributedAt: new Date('2022-01-10T00:00:00.000Z'),
  };
  const contribution2: SeedContribution = {
    userId: user1.id,
    amount: 1800,
    contributedAt: new Date('2023-05-15T00:00:00.000Z'),
    carencyDate: new Date('2025-05-15T00:00:00.000Z'),
    vestings: [
      { releaseAt: new Date('2024-05-15T00:00:00.000Z'), amount: 600 },
      { releaseAt: new Date('2025-05-15T00:00:00.000Z'), amount: 1200 },
    ],
  };
  const contribution3: SeedContribution = {
    userId: user2.id,
    amount: 3200,
    contributedAt: new Date('2021-08-01T00:00:00.000Z'),
    redeemedAmount: 0,
  };

  const contributions = [contribution1, contribution2, contribution3];

  const balances: SeedBalance[] = [
    {
      userId: user1.id,
      totalAmount: contribution1.amount + contribution2.amount,
      availableAmount:
        contribution1.amount - (contribution1.redeemedAmount ?? 0),
      lockedAmount: contribution2.amount,
      calculatedAt: now,
    },
    {
      userId: user2.id,
      totalAmount: contribution3.amount,
      availableAmount: contribution3.amount,
      lockedAmount: 0,
      calculatedAt: now,
    },
  ];

  const withdrawals: SeedWithdrawal[] = [
    {
      userId: user1.id,
      type: 'PARTIAL',
      requestedAmount: 500,
      requestedAt: new Date('2024-01-08T10:00:00.000Z'),
      processedAt: new Date('2024-01-08T10:30:00.000Z'),
      items: [
        {
          contributionRef: {
            userId: user1.id,
            contributedAt: contribution1.contributedAt,
          },
          amount: 500,
        },
      ],
    },
  ];

  return {
    users: [user1, user2],
    contributions,
    balances,
    withdrawals,
  };
}
