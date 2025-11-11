import { CarencyDate } from '../value-objects/carency-date.vo';
import { Money } from '../value-objects/money.vo';
import {
  ContributionVesting,
  ContributionVestingProps,
} from './contribution-vesting.entity';

export interface ContributionProps {
  id: string;
  userId: string;
  amount: Money;
  contributedAt: Date;
  carencyDate?: CarencyDate;
  redeemedAmount?: Money;
  vestings?: ContributionVesting[] | ContributionVestingProps[];
}

export class Contribution {
  private readonly id: string;
  private readonly userId: string;
  private readonly amount: Money;
  private readonly contributedAt: Date;
  private readonly carencyDate?: CarencyDate;
  private readonly redeemedAmount: Money;
  private readonly vestings: ContributionVesting[];

  constructor(props: ContributionProps) {
    this.assertValidId(props.id);
    this.assertValidId(props.userId, 'userId');
    this.assertValidContributionDate(props.contributedAt);
    this.assertValidCarencyDate(props.carencyDate, props.contributedAt);
    this.assertValidRedeemedAmount(props.amount, props.redeemedAmount);

    this.id = props.id;
    this.userId = props.userId;
    this.amount = props.amount;
    this.contributedAt = new Date(props.contributedAt.getTime());
    this.carencyDate = props.carencyDate;
    this.redeemedAmount = props.redeemedAmount ?? Money.zero();
    this.vestings = this.normalizeVestings(props.vestings);
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getAmount(): Money {
    return this.amount;
  }

  getContributionDate(): Date {
    return new Date(this.contributedAt.getTime());
  }

  getCarencyDate(): CarencyDate | undefined {
    return this.carencyDate;
  }

  getRedeemedAmount(): Money {
    return this.redeemedAmount;
  }

  getRemainingBalance(): Money {
    if (this.redeemedAmount.greaterThan(this.amount)) {
      return Money.zero();
    }

    return this.amount.subtract(this.redeemedAmount);
  }

  isAvailable(referenceDate: Date = new Date()): boolean {
    if (!this.carencyDate) {
      return true;
    }

    return this.carencyDate.hasMatured(referenceDate);
  }

  getAvailableAmount(referenceDate: Date = new Date()): Money {
    const remainingBalance = this.getRemainingBalance();

    if (remainingBalance.isZero()) {
      return Money.zero();
    }

    if (this.isAvailable(referenceDate)) {
      return remainingBalance;
    }

    const unlockedByVestings = this.vestings
      .filter((vesting) => vesting.hasMatured(referenceDate))
      .reduce((total, vesting) => total.add(vesting.getAmount()), Money.zero());

    if (unlockedByVestings.isZero()) {
      return Money.zero();
    }

    if (!unlockedByVestings.greaterThan(this.redeemedAmount)) {
      return Money.zero();
    }

    const unlockedAfterRedemption = unlockedByVestings.subtract(
      this.redeemedAmount,
    );

    if (unlockedAfterRedemption.greaterThan(remainingBalance)) {
      return remainingBalance;
    }

    return unlockedAfterRedemption;
  }

  getVestings(): ContributionVesting[] {
    return this.vestings.map(
      (vesting) =>
        new ContributionVesting({
          id: vesting.getId(),
          amount: new Money(vesting.getAmount().amount),
          releaseAt: vesting.getReleaseDate(),
        }),
    );
  }

  private assertValidId(id: string, field: string = 'id'): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error(`Contribution ${field} must be a non-empty string`);
    }
  }

  private assertValidContributionDate(date: Date): void {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new Error('Contribution date must be a valid date');
    }
  }

  private assertValidCarencyDate(
    carencyDate: CarencyDate | undefined,
    contributionDate: Date,
  ): void {
    if (!carencyDate) {
      return;
    }

    const contributionTime = contributionDate.getTime();
    const carencyTime = carencyDate.date.getTime();

    if (carencyTime < contributionTime) {
      throw new Error('Carency date cannot be before the contribution date');
    }
  }

  private assertValidRedeemedAmount(
    amount: Money,
    redeemedAmount: Money | undefined,
  ): void {
    if (!redeemedAmount) {
      return;
    }

    if (redeemedAmount.greaterThan(amount)) {
      throw new Error('Redeemed amount cannot exceed contribution amount');
    }
  }

  private normalizeVestings(
    vestings: ContributionVesting[] | ContributionVestingProps[] | undefined,
  ): ContributionVesting[] {
    if (!vestings || vestings.length === 0) {
      return [];
    }

    return vestings
      .map((vesting) =>
        vesting instanceof ContributionVesting
          ? vesting
          : new ContributionVesting(vesting as ContributionVestingProps),
      )
      .sort(
        (a, b) => a.getReleaseDate().getTime() - b.getReleaseDate().getTime(),
      );
  }
}
