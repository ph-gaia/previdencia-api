import { ValueTransformer } from 'typeorm';

export class NumericTransformer implements ValueTransformer {
  to(value: number | null | undefined): string | null | undefined {
    if (value === null || value === undefined) {
      return value?.toString() ?? null;
    }

    return value.toString();
  }

  from(value: string | null | undefined): number | null | undefined {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value);
  }
}
