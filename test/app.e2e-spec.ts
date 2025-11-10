import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { UserOrmEntity } from '../src/infrastructure/database/entities/user.orm-entity';
import { ContributionOrmEntity } from '../src/infrastructure/database/entities/contribution.orm-entity';
import { ContributionVestingOrmEntity } from '../src/infrastructure/database/entities/contribution-vesting.orm-entity';
import { WithdrawalOrmEntity } from '../src/infrastructure/database/entities/withdrawal.orm-entity';
import { WithdrawalItemOrmEntity } from '../src/infrastructure/database/entities/withdrawal-item.orm-entity';
import { UserBalanceOrmEntity } from '../src/infrastructure/database/entities/user-balance.orm-entity';
import { newDb } from 'pg-mem';

describe('AppController (e2e)', () => {
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

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await dataSource.destroy();
  });

  it('responde 404 na raiz por ausência de rota pública', () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    return request(server).get('/').expect(404);
  });
});
