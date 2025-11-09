import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UserOrmEntity } from './entities/user.orm-entity';
import { ContributionOrmEntity } from './entities/contribution.orm-entity';

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_USERNAME = 'previdencia',
  DB_PASSWORD = 'previdencia',
  DB_NAME = 'previdencia',
} = process.env;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: Number(DB_PORT),
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: [UserOrmEntity, ContributionOrmEntity],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
});

export async function initializeDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  return AppDataSource.initialize();
}
