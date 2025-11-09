import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WithdrawalOrmEntity } from './withdrawal.orm-entity';
import { ContributionOrmEntity } from './contribution.orm-entity';
import { NumericTransformer } from '../transformers/numeric.transformer';

@Entity({ name: 'withdrawal_items' })
export class WithdrawalItemOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'withdrawal_id', type: 'uuid' })
  withdrawalId!: string;

  @Column({ name: 'contribution_id', type: 'uuid' })
  contributionId!: string;

  @ManyToOne(() => WithdrawalOrmEntity, (withdrawal) => withdrawal.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'withdrawal_id' })
  withdrawal!: WithdrawalOrmEntity;

  @ManyToOne(
    () => ContributionOrmEntity,
    (contribution) => contribution.withdrawalItems,
    { onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'contribution_id' })
  contribution!: ContributionOrmEntity;

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
