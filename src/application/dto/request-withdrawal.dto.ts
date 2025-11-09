import { WithdrawalType } from '../../domain/domain.types';

export interface RequestWithdrawalInputDto {
  userId: string;
  type: WithdrawalType;
  /**
   * Valor solicitado para resgates parciais.
   */
  requestedAmount?: number;
  /**
   * Identificador opcional do pedido, caso venha de um sistema externo.
   */
  requestId?: string;
  /**
   * Data do pedido (string ISO). Caso ausente, utiliza a data atual.
   */
  requestedAt?: string;
  notes?: string;
}
