import { IEvent } from '@nestjs/cqrs';

export class WithdrawalProcessedEvent implements IEvent {
  constructor(public readonly userId: string) {}
}
