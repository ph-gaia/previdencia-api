import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrevidenciaTables1700000000000
  implements MigrationInterface
{
  name = 'CreatePrevidenciaTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY,
        full_name varchar(255) NOT NULL,
        document varchar(20) NOT NULL UNIQUE,
        birth_date date NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contributions (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount numeric(15,2) NOT NULL,
        redeemed_amount numeric(15,2) NOT NULL DEFAULT 0,
        contributed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        carency_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contribution_vestings (
        id uuid PRIMARY KEY,
        contribution_id uuid NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
        release_at TIMESTAMP WITH TIME ZONE NOT NULL,
        amount numeric(15,2) NOT NULL CHECK (amount >= 0),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT chk_vesting_amount_nonzero CHECK (amount > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type varchar(20) NOT NULL,
        requested_amount numeric(15,2),
        status varchar(20) NOT NULL,
        requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS withdrawal_items (
        id uuid PRIMARY KEY,
        withdrawal_id uuid NOT NULL REFERENCES withdrawals(id) ON DELETE CASCADE,
        contribution_id uuid NOT NULL REFERENCES contributions(id) ON DELETE RESTRICT,
        amount numeric(15,2) NOT NULL CHECK (amount >= 0),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT chk_withdrawal_item_amount_nonzero CHECK (amount > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_balances (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        total_amount numeric(15,2) NOT NULL DEFAULT 0,
        available_amount numeric(15,2) NOT NULL DEFAULT 0,
        locked_amount numeric(15,2) NOT NULL DEFAULT 0,
        calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT chk_user_balance_nonnegative CHECK (
          total_amount >= 0 AND available_amount >= 0 AND locked_amount >= 0
        )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contributions_user_id
        ON contributions (user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vestings_contribution_release
        ON contribution_vestings (contribution_id, release_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id
        ON withdrawals (user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_withdrawals_status
        ON withdrawals (status)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawal_items_unique
        ON withdrawal_items (withdrawal_id, contribution_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_withdrawal_items_unique
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_withdrawals_status
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_withdrawals_user_id
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_vestings_contribution_release
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_contributions_user_id
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS user_balances
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS withdrawal_items
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS withdrawals
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS contribution_vestings
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS contributions
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS users
    `);
  }
}
