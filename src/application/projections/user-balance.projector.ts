import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { USER_BALANCE_PROJECTION_REPOSITORY } from '../../domain/repositories/user-balance-projection.repository';
import type {
  UserBalanceProjection,
  UserBalanceProjectionRepository,
} from '../../domain/repositories/user-balance-projection.repository';
import { ContributionOrmEntity } from '../../infrastructure/database/entities/contribution.orm-entity';

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
    let availableAmount = 0;

    contributions.forEach((contribution) => {
      const amount = this.round(Number(contribution.amount));
      const redeemed = this.round(Number(contribution.redeemedAmount ?? 0));
      const matured = this.computeMaturedAmount(contribution, referenceDate);

      totalAmount += amount;
      maturedTotal += matured;

      const availableForContribution = Math.max(
        0,
        this.round(matured - redeemed),
      );
      availableAmount += Math.min(
        availableForContribution,
        this.round(amount - redeemed),
      );
    });

    const lockedAmount = Math.max(0, this.round(totalAmount - maturedTotal));

    return {
      totalAmount: this.round(totalAmount),
      availableAmount: this.round(availableAmount),
      lockedAmount: this.round(lockedAmount),
    };
  }

  private computeMaturedAmount(
    contribution: ContributionOrmEntity,
    referenceDate: Date,
  ): number {
    const amount = this.round(Number(contribution.amount));

    if (contribution.vestings && contribution.vestings.length > 0) {
      const maturedFromVestings = contribution.vestings
        .filter((vesting) => vesting.releaseAt <= referenceDate)
        .reduce((sum, vesting) => sum + Number(vesting.amount), 0);

      return Math.min(amount, this.round(maturedFromVestings));
    }

    if (
      !contribution.carencyDate ||
      contribution.carencyDate <= referenceDate
    ) {
      return amount;
    }

    return 0;
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}
