import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { AppModule } from '../../src/app.module';
import { UserOrmEntity } from '../../src/infrastructure/database/entities/user.orm-entity';
import { ContributionOrmEntity } from '../../src/infrastructure/database/entities/contribution.orm-entity';
import { ContributionVestingOrmEntity } from '../../src/infrastructure/database/entities/contribution-vesting.orm-entity';
import { WithdrawalOrmEntity } from '../../src/infrastructure/database/entities/withdrawal.orm-entity';
import { WithdrawalItemOrmEntity } from '../../src/infrastructure/database/entities/withdrawal-item.orm-entity';
import { UserBalanceOrmEntity } from '../../src/infrastructure/database/entities/user-balance.orm-entity';
import { newDb } from 'pg-mem';

describe('Saldo e Resgate (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
    memoryDb.public.registerFunction({
      name: 'version',
      implementation: () => 'PostgreSQL 16.0 on pg-mem',
    });
    memoryDb.public.registerFunction({
      name: 'current_database',
      implementation: () => 'pg_mem',
    });
    dataSource = (await memoryDb.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [
        UserOrmEntity,
        ContributionOrmEntity,
        ContributionVestingOrmEntity,
        WithdrawalOrmEntity,
        WithdrawalItemOrmEntity,
        UserBalanceOrmEntity,
      ],
    })) as DataSource;
    await dataSource.initialize();
    await dataSource.synchronize();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource
      .createQueryBuilder()
      .delete()
      .from(WithdrawalItemOrmEntity)
      .execute();
    await dataSource
      .createQueryBuilder()
      .delete()
      .from(WithdrawalOrmEntity)
      .execute();
    await dataSource
      .createQueryBuilder()
      .delete()
      .from(ContributionVestingOrmEntity)
      .execute();
    await dataSource
      .createQueryBuilder()
      .delete()
      .from(ContributionOrmEntity)
      .execute();
    await dataSource
      .createQueryBuilder()
      .delete()
      .from(UserBalanceOrmEntity)
      .execute();
    await dataSource
      .createQueryBuilder()
      .delete()
      .from(UserOrmEntity)
      .execute();
  });

  it('consulta o saldo consolidado do usuário', async () => {
    const userId = randomUUID();
    await seedUserWithContributions(userId, [
      {
        amount: 200,
        contributedAt: '2023-01-01T00:00:00.000Z',
      },
      {
        amount: 300,
        contributedAt: '2023-02-01T00:00:00.000Z',
        carencyDate: '2030-01-01T00:00:00.000Z',
      },
    ]);

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get(`/users/${userId}/balance`)
      .expect(200);

    expect(response.body).toEqual({
      userId,
      total: 500,
      available: 200,
    });

    const balanceProjection = await dataSource
      .getRepository(UserBalanceOrmEntity)
      .findOne({ where: { userId } });

    expect(balanceProjection).toMatchObject({
      userId,
      totalAmount: 500,
      availableAmount: 200,
      lockedAmount: 300,
    });
  });

  it('processa um pedido de resgate parcial e atualiza o saldo projetado', async () => {
    const userId = randomUUID();
    await seedUserWithContributions(userId, [
      {
        amount: 300,
        contributedAt: '2023-01-01T00:00:00.000Z',
      },
      {
        amount: 150,
        contributedAt: '2023-01-15T00:00:00.000Z',
      },
    ]);

    const withdrawalRequestId = randomUUID();
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const withdrawalResponse = await request(httpServer)
      .post(`/users/${userId}/withdrawals`)
      .send({
        type: 'PARTIAL',
        requestedAmount: 350,
        requestedAt: '2024-05-01T00:00:00.000Z',
        requestId: withdrawalRequestId,
      })
      .expect(201);

    expect(withdrawalResponse.body).toMatchObject({
      requestId: withdrawalRequestId,
      userId,
      type: 'PARTIAL',
      approvedAmount: 350,
      availableBalanceAfterRequest: 100,
      requestedAt: '2024-05-01T00:00:00.000Z',
    });

    const updatedContributions = await dataSource
      .getRepository(ContributionOrmEntity)
      .find({ where: { userId }, order: { contributedAt: 'ASC' } });

    expect(Number(updatedContributions[0].redeemedAmount)).toBeCloseTo(300);
    expect(Number(updatedContributions[1].redeemedAmount)).toBeCloseTo(50);

    const balanceAfterWithdrawal = await request(httpServer)
      .get(`/users/${userId}/balance`)
      .expect(200);

    expect(balanceAfterWithdrawal.body).toEqual({
      userId,
      total: 450,
      available: 100,
    });
  });

  async function seedUserWithContributions(
    userId: string,
    contributions: Array<{
      amount: number;
      contributedAt: string;
      carencyDate?: string;
    }>,
  ): Promise<void> {
    const userRepo = dataSource.getRepository(UserOrmEntity);
    const contributionRepo = dataSource.getRepository(ContributionOrmEntity);

    const user = new UserOrmEntity();
    user.id = userId;
    user.fullName = 'E2E User';
    user.document = `99999999${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;
    user.phoneNumber = '+5511999999999';
    user.birthDate = new Date('1990-01-01T00:00:00.000Z');
    await userRepo.save(user);

    for (const contributionInput of contributions) {
      const contribution = new ContributionOrmEntity();
      contribution.id = randomUUID();
      contribution.userId = userId;
      contribution.amount = contributionInput.amount;
      contribution.redeemedAmount = 0;
      contribution.contributedAt = new Date(contributionInput.contributedAt);
      contribution.carencyDate = contributionInput.carencyDate
        ? new Date(contributionInput.carencyDate)
        : null;
      await contributionRepo.save(contribution);
    }
  }
});
