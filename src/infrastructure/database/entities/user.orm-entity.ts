import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContributionOrmEntity } from './contribution.orm-entity';
import { WithdrawalOrmEntity } from './withdrawal.orm-entity';
import { UserBalanceOrmEntity } from './user-balance.orm-entity';

@Entity({ name: 'users' })
export class UserOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  document!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, unique: true })
  phoneNumber!: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @OneToMany(() => ContributionOrmEntity, (contribution) => contribution.user)
  contributions!: ContributionOrmEntity[];

  @OneToMany(() => WithdrawalOrmEntity, (withdrawal) => withdrawal.user)
  withdrawals!: WithdrawalOrmEntity[];

  @OneToOne(() => UserBalanceOrmEntity, (balance) => balance.user, {
    cascade: true,
  })
  balance?: UserBalanceOrmEntity;
}
