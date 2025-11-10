import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { WithdrawalProcessedEvent } from '../events/withdrawal-processed.event';
import { UserBalanceProjector } from '../../projections/user-balance.projector';

@EventsHandler(WithdrawalProcessedEvent)
export class WithdrawalProcessedEventHandler
  implements IEventHandler<WithdrawalProcessedEvent>
{
  constructor(private readonly projector: UserBalanceProjector) {}

  async handle(event: WithdrawalProcessedEvent): Promise<void> {
    await this.projector.project(event.userId);
  }
}
