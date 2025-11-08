import { CarencyDate } from '../value-objects/carency-date.vo';
import { Money } from '../value-objects/money.vo';

export interface ContributionProps {
  id: string;
  userId: string;
  amount: Money;
  contributedAt: Date;
  carencyDate?: CarencyDate;
}

export class Contribution {
  private readonly id: string;
  private readonly userId: string;
  private readonly amount: Money;
  private readonly contributedAt: Date;
  private readonly carencyDate?: CarencyDate;

  constructor(props: ContributionProps) {
    this.assertValidId(props.id);
    this.assertValidId(props.userId, 'userId');
    this.assertValidContributionDate(props.contributedAt);
    this.assertValidCarencyDate(props.carencyDate, props.contributedAt);

    this.id = props.id;
    this.userId = props.userId;
    this.amount = props.amount;
    this.contributedAt = new Date(props.contributedAt.getTime());
    this.carencyDate = props.carencyDate;
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

  isAvailable(referenceDate: Date = new Date()): boolean {
    if (!this.carencyDate) {
      return true;
    }

    return this.carencyDate.hasMatured(referenceDate);
  }

  getAvailableAmount(referenceDate: Date = new Date()): Money {
    if (this.isAvailable(referenceDate)) {
      return this.amount;
    }

    return Money.zero();
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
}

