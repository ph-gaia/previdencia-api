export interface GetBalanceInputDto {
  userId: string;
  /**
   * Data de referência para cálculo do saldo.
   * Aceita string ISO. Se omitido, utiliza a data atual.
   */
  referenceDate?: string;
}

export interface GetBalanceOutputDto {
  userId: string;
  total: number;
  available: number;
}

