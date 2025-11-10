import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { USER_BALANCE_PROJECTION_REPOSITORY } from '../../domain/repositories/user-balance-projection.repository';
import type {
  UserBalanceProjection,
  UserBalanceProjectionRepository,
} from '../../domain/repositories/user-balance-projection.repository';
import { ContributionOrmEntity } from '../../infrastructure/database/entities/contribution.orm-entity';
import { calculateContributionAvailability } from '../utils/contribution-availability.util';

@Injectable()
export class UserBalanceProjector {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(USER_BALANCE_PROJECTION_REPOSITORY)
    private readonly userBalanceRepository: UserBalanceProjectionRepository,
  ) {}

  async project(
    userId: string,
    referenceDate: Date = new Date(),
  ): Promise<void> {
    const contributions = await this.dataSource
      .getRepository(ContributionOrmEntity)
      .find({
        where: { userId },
        relations: { vestings: true },
        order: { contributedAt: 'ASC' },
      });

    const { totalAmount, availableAmount, lockedAmount } = this.computeSummary(
      contributions,
      referenceDate,
    );

    const projection: UserBalanceProjection = {
      userId,
      totalAmount,
      availableAmount,
      lockedAmount,
      calculatedAt: referenceDate,
    };

    await this.userBalanceRepository.upsert(projection);
  }

  private computeSummary(
    contributions: ContributionOrmEntity[],
    referenceDate: Date,
  ): Pick<
    UserBalanceProjection,
    'totalAmount' | 'availableAmount' | 'lockedAmount'
  > {
    let totalAmount = 0;
    let maturedTotal = 0;
    let availableAmountSum = 0;

    contributions.forEach((contribution) => {
      const availability = calculateContributionAvailability(
        contribution,
        referenceDate,
      );

      totalAmount += availability.totalAmount;
      maturedTotal += availability.maturedAmount;
      availableAmountSum += availability.availableAmount;
    });

    const lockedAmount = Math.max(0, this.round(totalAmount - maturedTotal));

    return {
      totalAmount: this.round(totalAmount),
      availableAmount: this.round(availableAmountSum),
      lockedAmount: this.round(lockedAmount),
    };
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}
