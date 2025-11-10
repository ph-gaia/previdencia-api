import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  UserBalanceProjection,
  UserBalanceProjectionRepository,
} from '../../domain/repositories/user-balance-projection.repository';
import { UserBalanceOrmEntity } from '../database/entities/user-balance.orm-entity';

@Injectable()
export class UserBalanceTypeOrmRepository
  implements UserBalanceProjectionRepository
{
  private readonly repository: Repository<UserBalanceOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserBalanceOrmEntity);
  }

  async findByUserId(userId: string): Promise<UserBalanceProjection | null> {
    const entity = await this.repository.findOne({ where: { userId } });
    if (!entity) {
      return null;
    }

    return {
      userId: entity.userId,
      totalAmount: Number(entity.totalAmount),
      availableAmount: Number(entity.availableAmount),
      lockedAmount: Number(entity.lockedAmount),
      calculatedAt: new Date(entity.calculatedAt.getTime()),
    };
  }

  async upsert(balance: UserBalanceProjection): Promise<void> {
    await this.repository.save({
      userId: balance.userId,
      totalAmount: balance.totalAmount,
      availableAmount: balance.availableAmount,
      lockedAmount: balance.lockedAmount,
      calculatedAt: balance.calculatedAt,
    });
  }
}
