import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RecalculateUserBalanceCommand } from '../commands/recalculate-user-balance.command';
import { UserBalanceProjector } from '../../projections/user-balance.projector';

@CommandHandler(RecalculateUserBalanceCommand)
export class RecalculateUserBalanceHandler
  implements ICommandHandler<RecalculateUserBalanceCommand>
{
  constructor(private readonly projector: UserBalanceProjector) {}

  async execute(command: RecalculateUserBalanceCommand): Promise<void> {
    await this.projector.project(command.userId, command.referenceDate);
  }
}
