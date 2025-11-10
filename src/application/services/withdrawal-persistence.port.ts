import { WithdrawalType } from '../../domain/domain.types';

export const WITHDRAWAL_PERSISTENCE = 'WITHDRAWAL_PERSISTENCE';

export interface WithdrawalPersistenceInput {
  withdrawalId?: string;
  userId: string;
  type: WithdrawalType;
  approvedAmount: number;
  requestedAmount?: number;
  requestedAt: Date;
  notes?: string;
}

export interface WithdrawalPersistencePort {
  process(input: WithdrawalPersistenceInput): Promise<void>;
}
