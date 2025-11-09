import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NumericTransformer } from '../transformers/numeric.transformer';
import { UserOrmEntity } from './user.orm-entity';

@Entity({ name: 'user_balances' })
export class UserBalanceOrmEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => UserOrmEntity, (user) => user.balance, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;

  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
    default: 0,
  })
  totalAmount!: number;

  @Column({
    name: 'available_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
    default: 0,
  })
  availableAmount!: number;

  @Column({
    name: 'locked_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
    default: 0,
  })
  lockedAmount!: number;

  @Column({ name: 'calculated_at', type: 'timestamp with time zone' })
  calculatedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
