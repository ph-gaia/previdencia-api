import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { NumericTransformer } from '../transformers/numeric.transformer';
import { ContributionVestingOrmEntity } from './contribution-vesting.orm-entity';
import { WithdrawalItemOrmEntity } from './withdrawal-item.orm-entity';

@Entity({ name: 'contributions' })
export class ContributionOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserOrmEntity, (user) => user.contributions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user?: UserOrmEntity;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  amount!: number;

  @Column({
    name: 'redeemed_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
    default: 0,
  })
  redeemedAmount!: number;

  @Column({ name: 'contributed_at', type: 'timestamp with time zone' })
  contributedAt!: Date;

  @Column({
    name: 'carency_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  carencyDate: Date | null = null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @OneToMany(
    () => ContributionVestingOrmEntity,
    (vesting) => vesting.contribution,
  )
  vestings?: ContributionVestingOrmEntity[];

  @OneToMany(
    () => WithdrawalItemOrmEntity,
    (withdrawalItem) => withdrawalItem.contribution,
  )
  withdrawalItems?: WithdrawalItemOrmEntity[];
}
