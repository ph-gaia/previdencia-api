export class Money {
  private readonly value: number;

  private static normalize(value: number): number {
    return Number(value.toFixed(2));
  }

  constructor(value: number) {
    if (!Number.isFinite(value)) {
      throw new Error('Money value must be a finite number');
    }

    if (value < 0) {
      throw new Error('Money value cannot be negative');
    }

    this.value = Money.normalize(value);
  }

  static zero(): Money {
    return new Money(0);
  }

  get amount(): number {
    return this.value;
  }

  isZero(): boolean {
    return this.value === 0;
  }

  add(other: Money): Money {
    return new Money(this.value + other.value);
  }

  subtract(other: Money): Money {
    if (other.value > this.value) {
      throw new Error('Insufficient funds');
    }

    return new Money(this.value - other.value);
  }

  greaterThan(other: Money): boolean {
    return this.value > other.value;
  }

  greaterThanOrEqual(other: Money): boolean {
    return this.value >= other.value;
  }

  equals(other: Money): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toFixed(2);
  }
}

