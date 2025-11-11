import { Money } from '../value-objects/money.vo';

export interface ContributionVestingProps {
  id: string;
  amount: Money;
  releaseAt: Date;
}

export class ContributionVesting {
  private readonly id: string;
  private readonly amount: Money;
  private readonly releaseAt: Date;

  constructor(props: ContributionVestingProps) {
    this.id = props.id;
    this.amount = props.amount;
    this.releaseAt = new Date(props.releaseAt.getTime());
  }

  getId(): string {
    return this.id;
  }

  getAmount(): Money {
    return this.amount;
  }

  getReleaseDate(): Date {
    return new Date(this.releaseAt.getTime());
  }

  hasMatured(referenceDate: Date = new Date()): boolean {
    return this.releaseAt.getTime() <= referenceDate.getTime();
  }
}
