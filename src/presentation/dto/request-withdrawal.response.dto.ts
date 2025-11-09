import { Expose } from 'class-transformer';
import { WithdrawalType } from '../../domain/domain.types';

export class RequestWithdrawalResponseDto {
  @Expose()
  requestId!: string;

  @Expose()
  userId!: string;

  @Expose()
  type!: WithdrawalType;

  @Expose()
  approvedAmount!: number;

  @Expose()
  availableBalanceAfterRequest!: number;

  @Expose()
  requestedAt!: string;

  @Expose()
  notes?: string;
}
