import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContributionOrmEntity } from './contribution.orm-entity';
import { NumericTransformer } from '../transformers/numeric.transformer';

@Entity({ name: 'contribution_vestings' })
export class ContributionVestingOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'contribution_id', type: 'uuid' })
  contributionId!: string;

  @ManyToOne(
    () => ContributionOrmEntity,
    (contribution) => contribution.vestings,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'contribution_id' })
  contribution!: ContributionOrmEntity;

  @Column({ name: 'release_at', type: 'timestamp with time zone' })
  releaseAt!: Date;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  amount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
