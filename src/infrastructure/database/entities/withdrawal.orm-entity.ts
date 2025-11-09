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
import { WithdrawalItemOrmEntity } from './withdrawal-item.orm-entity';

@Entity({ name: 'withdrawals' })
export class WithdrawalOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserOrmEntity, (user) => user.withdrawals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;

  @Column({ type: 'varchar', length: 20 })
  type!: string;

  @Column({
    name: 'requested_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
    nullable: true,
  })
  requestedAmount: number | null = null;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'requested_at', type: 'timestamp with time zone' })
  requestedAt!: Date;

  @Column({
    name: 'processed_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  processedAt: Date | null = null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @OneToMany(() => WithdrawalItemOrmEntity, (item) => item.withdrawal, {
    cascade: true,
  })
  items?: WithdrawalItemOrmEntity[];
}
