import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../database/entities/user.orm-entity';
import { ContributionMapper } from './contribution.mapper';

export class UserMapper {
  static toDomain(entity: UserOrmEntity): User {
    const contributions =
      entity.contributions?.map((contribution) =>
        ContributionMapper.toDomain(contribution),
      ) ?? [];

    return new User(
      {
        id: entity.id,
        fullName: entity.fullName,
        document: entity.document,
        birthDate: new Date(entity.birthDate),
      },
      contributions,
    );
  }

  static toPersistence(entity: User): UserOrmEntity {
    const user = new UserOrmEntity();
    user.id = entity.getId();
    user.fullName = entity.getFullName();
    user.document = entity.getDocument();
    user.birthDate = entity.getBirthDate();
    user.contributions = entity
      .getContributions()
      .map((contribution) => ContributionMapper.toPersistence(contribution));

    return user;
  }
}
