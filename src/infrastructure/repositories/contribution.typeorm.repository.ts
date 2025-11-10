import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { ContributionRepository } from '../../domain/repositories/contribution-repository.interface';
import { Contribution } from '../../domain/entities/contribution.entity';
import { ContributionOrmEntity } from '../database/entities/contribution.orm-entity';
import { ContributionMapper } from '../mappers/contribution.mapper';
import { ContributionSavedEvent } from '../../application/cqrs/events/contribution-saved.event';

@Injectable()
export class ContributionTypeOrmRepository implements ContributionRepository {
  private readonly repository: Repository<ContributionOrmEntity>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
  ) {
    this.repository = this.dataSource.getRepository(ContributionOrmEntity);
  }

  async findById(id: string): Promise<Contribution | null> {
    const contribution = await this.repository.findOne({
      where: { id },
    });

    if (!contribution) {
      return null;
    }

    return ContributionMapper.toDomain(contribution);
  }

  async findByUserId(userId: string): Promise<Contribution[]> {
    const contributions = await this.repository.find({
      where: { userId },
      order: { contributedAt: 'ASC' },
    });

    return contributions.map((contribution) =>
      ContributionMapper.toDomain(contribution),
    );
  }

  async save(contribution: Contribution): Promise<void> {
    const persistenceContribution =
      ContributionMapper.toPersistence(contribution);
    await this.repository.save(persistenceContribution);
    this.eventBus.publish(new ContributionSavedEvent(contribution.getUserId()));
  }
}
