import { Contribution } from '../entities/contribution.entity';

export interface ContributionRepository {
  findById(id: string): Promise<Contribution | null>;
  findByUserId(userId: string): Promise<Contribution[]>;
  save(contribution: Contribution): Promise<void>;
}

