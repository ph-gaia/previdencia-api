import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { runSeed } from './seed-data';

async function bootstrap(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  try {
    await runSeed(dataSource);
    console.log('Seed data loaded successfully.');
  } catch (error) {
    console.error('Failed to run seed:', error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

void bootstrap();
