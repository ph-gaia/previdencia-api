export class CarencyDate {
  private readonly value: Date;

  constructor(value: Date) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error('Invalid carency date');
    }

    this.value = new Date(value.getTime());
  }

  get date(): Date {
    return new Date(this.value.getTime());
  }

  hasMatured(referenceDate: Date = new Date()): boolean {
    return this.value.getTime() <= referenceDate.getTime();
  }

  isAfter(date: Date): boolean {
    return this.value.getTime() > date.getTime();
  }

  equals(other: CarencyDate): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
