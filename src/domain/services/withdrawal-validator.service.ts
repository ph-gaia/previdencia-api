import { Contribution } from '../entities/contribution.entity';
import { WithdrawalRequest } from '../entities/withdrawal-request.entity';
import { BalanceCalculatorService } from './balance-calculator.service';
import { InsufficientBalanceException } from '../exceptions/insufficient-balance.exception';
import { InvalidWithdrawalException } from '../exceptions/invalid-withdrawal.exception';
import { Money } from '../value-objects/money.vo';

export class WithdrawalValidatorService {
  constructor(
    private readonly balanceCalculator: BalanceCalculatorService = new BalanceCalculatorService(),
  ) {}

  validate(
    request: WithdrawalRequest,
    contributions: Contribution[],
    referenceDate: Date = new Date(),
  ): Money {
    this.assertContributionsBelongToUser(request, contributions);

    const availableBalance = this.balanceCalculator.calculateAvailable(
      contributions,
      referenceDate,
    );

    if (availableBalance.isZero()) {
      throw new InsufficientBalanceException();
    }

    if (request.isTotalWithdrawal()) {
      return availableBalance;
    }

    const requestedAmount = request.getRequestedAmount();
    if (!requestedAmount) {
      throw new InvalidWithdrawalException(
        'Partial withdrawal must include a requested amount',
      );
    }

    if (requestedAmount.greaterThan(availableBalance)) {
      throw new InsufficientBalanceException(
        'Requested amount exceeds available balance',
      );
    }

    return requestedAmount;
  }

  private assertContributionsBelongToUser(
    request: WithdrawalRequest,
    contributions: Contribution[],
  ): void {
    const invalidContribution = contributions.find(
      (contribution) => contribution.getUserId() !== request.getUserId(),
    );

    if (invalidContribution) {
      throw new InvalidWithdrawalException(
        'Contributions must belong to the requesting user',
      );
    }
  }
}
