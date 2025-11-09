import { Contribution } from '../../domain/entities/contribution.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { CarencyDate } from '../../domain/value-objects/carency-date.vo';
import { ContributionOrmEntity } from '../database/entities/contribution.orm-entity';
import { UserOrmEntity } from '../database/entities/user.orm-entity';

export class ContributionMapper {
  static toDomain(entity: ContributionOrmEntity): Contribution {
    return new Contribution({
      id: entity.id,
      userId: entity.userId,
      amount: new Money(entity.amount),
      contributedAt: new Date(entity.contributedAt.getTime()),
      carencyDate: entity.carencyDate
        ? new CarencyDate(new Date(entity.carencyDate.getTime()))
        : undefined,
    });
  }

  static toPersistence(entity: Contribution): ContributionOrmEntity {
    const contribution = new ContributionOrmEntity();
    contribution.id = entity.getId();
    contribution.userId = entity.getUserId();
    contribution.amount = entity.getAmount().amount;
    contribution.contributedAt = entity.getContributionDate();
    contribution.carencyDate = entity.getCarencyDate()?.date ?? null;
    contribution.user = { id: entity.getUserId() } as UserOrmEntity;

    return contribution;
  }
}
