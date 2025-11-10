export interface UserBalanceProjection {
  userId: string;
  totalAmount: number;
  availableAmount: number;
  lockedAmount: number;
  calculatedAt: Date;
}

export const USER_BALANCE_PROJECTION_REPOSITORY =
  'USER_BALANCE_PROJECTION_REPOSITORY';

export interface UserBalanceProjectionRepository {
  findByUserId(userId: string): Promise<UserBalanceProjection | null>;
  upsert(balance: UserBalanceProjection): Promise<void>;
}
