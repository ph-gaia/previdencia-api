import { ContributionOrmEntity } from '../../infrastructure/database/entities/contribution.orm-entity';

export interface ContributionAvailability {
  totalAmount: number;
  maturedAmount: number;
  availableAmount: number;
  lockedAmount: number;
}

export function calculateContributionAvailability(
  contribution: ContributionOrmEntity,
  referenceDate: Date,
): ContributionAvailability {
  const totalAmount = round(toNumber(contribution.amount));
  const redeemedAmount = round(toNumber(contribution.redeemedAmount ?? 0));

  const maturedAmount = computeMaturedAmount(
    contribution,
    referenceDate,
    totalAmount,
  );
  const lockedAmount = Math.max(0, round(totalAmount - maturedAmount));

  const availableBeforeCap = Math.max(0, round(maturedAmount - redeemedAmount));
  const remainingBalance = Math.max(0, round(totalAmount - redeemedAmount));
  const availableAmount = Math.min(availableBeforeCap, remainingBalance);

  return {
    totalAmount,
    maturedAmount,
    availableAmount,
    lockedAmount,
  };
}

function computeMaturedAmount(
  contribution: ContributionOrmEntity,
  referenceDate: Date,
  totalAmount: number,
): number {
  if (contribution.vestings && contribution.vestings.length > 0) {
    const maturedFromVestings = contribution.vestings
      .filter((vesting) => vesting.releaseAt <= referenceDate)
      .reduce((sum, vesting) => sum + toNumber(vesting.amount), 0);

    return round(Math.min(totalAmount, maturedFromVestings));
  }

  if (!contribution.carencyDate || contribution.carencyDate <= referenceDate) {
    return totalAmount;
  }

  return 0;
}

function toNumber(value: unknown): number {
  const numericValue =
    typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
