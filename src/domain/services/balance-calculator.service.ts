import { Contribution } from '../entities/contribution.entity';
import { BalanceSummary } from '../domain.types';
import { Money } from '../value-objects/money.vo';

export class BalanceCalculatorService {
  calculateTotal(contributions: Contribution[]): Money {
    return contributions.reduce(
      (total, contribution) => total.add(contribution.getAmount()),
      Money.zero(),
    );
  }

  calculateAvailable(contributions: Contribution[], referenceDate: Date = new Date()): Money {
    return contributions.reduce(
      (available, contribution) => available.add(contribution.getAvailableAmount(referenceDate)),
      Money.zero(),
    );
  }

  calculateSummary(contributions: Contribution[], referenceDate: Date = new Date()): BalanceSummary {
    const total = this.calculateTotal(contributions);
    const available = this.calculateAvailable(contributions, referenceDate);

    return { total, available };
  }
}

