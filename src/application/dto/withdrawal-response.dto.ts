import { WithdrawalType } from '../../domain/domain.types';

export interface WithdrawalResponseDto {
  requestId: string;
  userId: string;
  type: WithdrawalType;
  approvedAmount: number;
  availableBalanceAfterRequest: number;
  requestedAt: string;
  notes?: string;
}

