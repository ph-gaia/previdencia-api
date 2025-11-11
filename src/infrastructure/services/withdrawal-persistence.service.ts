import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  WithdrawalPersistenceInput,
  WithdrawalPersistencePort,
} from '../../application/services/withdrawal-persistence.port';
import { WithdrawalOrmEntity } from '../database/entities/withdrawal.orm-entity';
import { WithdrawalItemOrmEntity } from '../database/entities/withdrawal-item.orm-entity';
import { ContributionOrmEntity } from '../database/entities/contribution.orm-entity';
import { calculateContributionAvailability } from '../../application/utils/contribution-availability.util';
import { WithdrawalProcessedEvent } from '../../application/cqrs/events/withdrawal-processed.event';

@Injectable()
export class WithdrawalPersistenceService implements WithdrawalPersistencePort {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
  ) {}

  async process(input: WithdrawalPersistenceInput): Promise<void> {
    const processedAt = new Date();

    await this.dataSource.transaction(async (manager) => {
      const contributionRepo = manager.getRepository(ContributionOrmEntity);
      const withdrawalRepo = manager.getRepository(WithdrawalOrmEntity);
      const withdrawalItemRepo = manager.getRepository(WithdrawalItemOrmEntity);

      const contributions = await contributionRepo.find({
        where: { userId: input.userId },
        relations: { vestings: true },
        order: { contributedAt: 'ASC' },
      });

      let remaining = round(input.approvedAmount);
      const allocations: Array<{
        contribution: ContributionOrmEntity;
        amount: number;
      }> = [];

      for (const contribution of contributions) {
        if (remaining <= 0) {
          break;
        }

        const availability = calculateContributionAvailability(
          contribution,
          input.requestedAt,
        );

        const availableBalance = round(availability.availableAmount);
        if (availableBalance <= 0) {
          continue;
        }

        const remainingContributionBalance = round(
          Math.max(
            0,
            toNumber(contribution.amount) -
              toNumber(contribution.redeemedAmount),
          ),
        );

        const redeemable = Math.min(
          remaining,
          availableBalance,
          remainingContributionBalance,
        );

        if (redeemable <= 0) {
          continue;
        }

        allocations.push({ contribution, amount: redeemable });
        remaining = round(remaining - redeemable);
      }

      if (remaining > 0.009) {
        throw new Error(
          'Unable to satisfy withdrawal amount with available contributions',
        );
      }

      const withdrawal = new WithdrawalOrmEntity();
      withdrawal.id = input.withdrawalId ?? randomUUID();
      withdrawal.userId = input.userId;
      withdrawal.type = input.type;
      withdrawal.requestedAmount =
        input.requestedAmount ?? round(input.approvedAmount);
      withdrawal.status = 'PROCESSED';
      withdrawal.requestedAt = input.requestedAt;
      withdrawal.processedAt = processedAt;

      await withdrawalRepo.save(withdrawal);

      for (const allocation of allocations) {
        const item = new WithdrawalItemOrmEntity();
        item.id = randomUUID();
        item.withdrawalId = withdrawal.id;
        item.contributionId = allocation.contribution.id;
        item.amount = allocation.amount;
        await withdrawalItemRepo.save(item);

        allocation.contribution.redeemedAmount = round(
          toNumber(allocation.contribution.redeemedAmount) + allocation.amount,
        );
        await contributionRepo.save(allocation.contribution);
      }
    });

    this.eventBus.publish(new WithdrawalProcessedEvent(input.userId));
  }
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
