export class InsufficientBalanceException extends Error {
  constructor(
    message: string = 'Insufficient available balance for withdrawal',
  ) {
    super(message);
    this.name = 'InsufficientBalanceException';
  }
}
