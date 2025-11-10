import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ContributionSavedEvent } from '../events/contribution-saved.event';
import { UserBalanceProjector } from '../../projections/user-balance.projector';

@EventsHandler(ContributionSavedEvent)
export class ContributionSavedEventHandler
  implements IEventHandler<ContributionSavedEvent>
{
  constructor(private readonly projector: UserBalanceProjector) {}

  async handle(event: ContributionSavedEvent): Promise<void> {
    await this.projector.project(event.userId);
  }
}
