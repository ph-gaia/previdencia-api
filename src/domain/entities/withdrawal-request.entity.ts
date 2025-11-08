import { WithdrawalType } from '../domain.types';
import { Money } from '../value-objects/money.vo';

export interface WithdrawalRequestProps {
  id: string;
  userId: string;
  type: WithdrawalType;
  requestedAmount?: Money;
  requestedAt: Date;
  notes?: string;
}

export class WithdrawalRequest {
  private readonly id: string;
  private readonly userId: string;
  private readonly type: WithdrawalType;
  private readonly requestedAmount?: Money;
  private readonly requestedAt: Date;
  private readonly notes?: string;

  constructor(props: WithdrawalRequestProps) {
    this.assertNonEmpty(props.id, 'id');
    this.assertNonEmpty(props.userId, 'userId');
    this.assertValidType(props.type);
    this.assertRequestedAmount(props.type, props.requestedAmount);
    this.assertRequestedAt(props.requestedAt);

    this.id = props.id;
    this.userId = props.userId;
    this.type = props.type;
    this.requestedAmount = props.requestedAmount;
    this.requestedAt = new Date(props.requestedAt.getTime());
    this.notes = props.notes;
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getType(): WithdrawalType {
    return this.type;
  }

  getRequestedAmount(): Money | undefined {
    return this.requestedAmount;
  }

  getRequestedAt(): Date {
    return new Date(this.requestedAt.getTime());
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  isTotalWithdrawal(): boolean {
    return this.type === WithdrawalType.TOTAL;
  }

  isPartialWithdrawal(): boolean {
    return this.type === WithdrawalType.PARTIAL;
  }

  private assertNonEmpty(value: string, field: keyof WithdrawalRequestProps): void {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`WithdrawalRequest ${field as string} must be a non-empty string`);
    }
  }

  private assertValidType(type: WithdrawalType): void {
    if (!Object.values(WithdrawalType).includes(type)) {
      throw new Error('Invalid withdrawal type');
    }
  }

  private assertRequestedAmount(type: WithdrawalType, amount?: Money): void {
    if (type === WithdrawalType.PARTIAL) {
      if (!amount) {
        throw new Error('Partial withdrawal must specify an amount');
      }

      if (amount.isZero()) {
        throw new Error('Partial withdrawal amount must be greater than zero');
      }
    }

    if (type === WithdrawalType.TOTAL && amount) {
      throw new Error('Total withdrawal cannot specify an amount');
    }
  }

  private assertRequestedAt(requestedAt: Date): void {
    if (!(requestedAt instanceof Date) || Number.isNaN(requestedAt.getTime())) {
      throw new Error('Invalid withdrawal request date');
    }
  }
}

