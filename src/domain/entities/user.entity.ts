import { Contribution } from './contribution.entity';

export interface UserProps {
  id: string;
  fullName: string;
  document: string;
  birthDate: Date;
}

export class User {
  private readonly id: string;
  private readonly fullName: string;
  private readonly document: string;
  private readonly birthDate: Date;
  private readonly contributions: Map<string, Contribution>;

  constructor(props: UserProps, contributions: Contribution[] = []) {
    this.assertNonEmpty(props.id, 'id');
    this.assertNonEmpty(props.fullName, 'fullName');
    this.assertNonEmpty(props.document, 'document');
    this.assertValidBirthDate(props.birthDate);

    this.id = props.id;
    this.fullName = props.fullName;
    this.document = props.document;
    this.birthDate = new Date(props.birthDate.getTime());
    this.contributions = new Map();

    contributions.forEach((contribution) => this.addContribution(contribution));
  }

  getId(): string {
    return this.id;
  }

  getFullName(): string {
    return this.fullName;
  }

  getDocument(): string {
    return this.document;
  }

  getBirthDate(): Date {
    return new Date(this.birthDate.getTime());
  }

  getContributions(): Contribution[] {
    return Array.from(this.contributions.values());
  }

  addContribution(contribution: Contribution): void {
    if (contribution.getUserId() !== this.id) {
      throw new Error('Contribution does not belong to this user');
    }

    this.contributions.set(contribution.getId(), contribution);
  }

  removeContribution(contributionId: string): void {
    this.contributions.delete(contributionId);
  }

  private assertNonEmpty(value: string, field: keyof UserProps): void {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`User ${field as string} must be a non-empty string`);
    }
  }

  private assertValidBirthDate(birthDate: Date): void {
    if (!(birthDate instanceof Date) || Number.isNaN(birthDate.getTime())) {
      throw new Error('User birthDate must be a valid date');
    }

    const now = new Date();
    if (birthDate.getTime() > now.getTime()) {
      throw new Error('User birthDate cannot be in the future');
    }
  }
}

