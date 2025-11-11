import { Contribution } from '../../domain/entities/contribution.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { CarencyDate } from '../../domain/value-objects/carency-date.vo';
import { ContributionOrmEntity } from '../database/entities/contribution.orm-entity';
import { UserOrmEntity } from '../database/entities/user.orm-entity';
import { ContributionVesting } from '../../domain/entities/contribution-vesting.entity';

export class ContributionMapper {
  static toDomain(entity: ContributionOrmEntity): Contribution {
    const vestings =
      entity.vestings?.map(
        (vesting) =>
          new ContributionVesting({
            id: vesting.id,
            amount: new Money(
              Number(
                vesting.amount !== undefined && vesting.amount !== null
                  ? vesting.amount
                  : 0,
              ),
            ),
            releaseAt: new Date(vesting.releaseAt.getTime()),
          }),
      ) ?? [];

    return new Contribution({
      id: entity.id,
      userId: entity.userId,
      amount: new Money(entity.amount),
      contributedAt: new Date(entity.contributedAt.getTime()),
      carencyDate: entity.carencyDate
        ? new CarencyDate(new Date(entity.carencyDate.getTime()))
        : undefined,
      redeemedAmount: new Money(
        Number(entity.redeemedAmount !== undefined ? entity.redeemedAmount : 0),
      ),
      vestings,
    });
  }

  static toPersistence(entity: Contribution): ContributionOrmEntity {
    const contribution = new ContributionOrmEntity();
    contribution.id = entity.getId();
    contribution.userId = entity.getUserId();
    contribution.amount = entity.getAmount().amount;
    contribution.contributedAt = entity.getContributionDate();
    contribution.carencyDate = entity.getCarencyDate()?.date ?? null;
    contribution.redeemedAmount = entity.getRedeemedAmount().amount;
    contribution.user = { id: entity.getUserId() } as UserOrmEntity;

    return contribution;
  }
}
