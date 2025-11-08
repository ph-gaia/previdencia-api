export class InvalidWithdrawalException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWithdrawalException';
  }
}

