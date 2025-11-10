import { ICommand } from '@nestjs/cqrs';

export class RecalculateUserBalanceCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly referenceDate: Date = new Date(),
  ) {}
}
