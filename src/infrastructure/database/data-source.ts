import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UserOrmEntity } from './entities/user.orm-entity';
import { ContributionOrmEntity } from './entities/contribution.orm-entity';
import { ContributionVestingOrmEntity } from './entities/contribution-vesting.orm-entity';
import { WithdrawalOrmEntity } from './entities/withdrawal.orm-entity';
import { WithdrawalItemOrmEntity } from './entities/withdrawal-item.orm-entity';
import { UserBalanceOrmEntity } from './entities/user-balance.orm-entity';

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} must be defined`);
  }
  return value;
}

const DATABASE_HOST = getRequiredEnv('DATABASE_HOST');
const DATABASE_PORT = Number(getRequiredEnv('DATABASE_PORT'));
const DATABASE_USER = getRequiredEnv('DATABASE_USER');
const DATABASE_PASSWORD = getRequiredEnv('DATABASE_PASSWORD');
const DATABASE_NAME = getRequiredEnv('DATABASE_NAME');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  username: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: [
    UserOrmEntity,
    ContributionOrmEntity,
    ContributionVestingOrmEntity,
    WithdrawalOrmEntity,
    WithdrawalItemOrmEntity,
    UserBalanceOrmEntity,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
});

export async function initializeDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  return AppDataSource.initialize();
}
