import { IEvent } from '@nestjs/cqrs';

export class ContributionSavedEvent implements IEvent {
  constructor(public readonly userId: string) {}
}
