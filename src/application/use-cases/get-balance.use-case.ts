import { IUseCase } from '../interfaces/i.use-case';
import {
  GetBalanceInputDto,
  GetBalanceOutputDto,
} from '../dto/get-balance.dto';
import { UserRepository } from '../../domain/repositories/user-repository.interface';
import { ContributionRepository } from '../../domain/repositories/contribution-repository.interface';
import { BalanceCalculatorService } from '../../domain/services/balance-calculator.service';

export class GetBalanceUseCase
  implements IUseCase<GetBalanceInputDto, GetBalanceOutputDto>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly contributionRepository: ContributionRepository,
    private readonly balanceCalculator: BalanceCalculatorService = new BalanceCalculatorService(),
  ) {}

  async execute(input: GetBalanceInputDto): Promise<GetBalanceOutputDto> {
    this.ensureUserId(input.userId);

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const contributions = await this.contributionRepository.findByUserId(
      user.getId(),
    );
    const referenceDate = this.parseReferenceDate(input.referenceDate);
    const balanceSummary = this.balanceCalculator.calculateSummary(
      contributions,
      referenceDate,
    );

    return {
      userId: user.getId(),
      total: balanceSummary.total.amount,
      available: balanceSummary.available.amount,
    };
  }

  private ensureUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('userId is required');
    }
  }

  private parseReferenceDate(referenceDate?: string): Date {
    if (!referenceDate) {
      return new Date();
    }

    const parsed = new Date(referenceDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid reference date');
    }

    return parsed;
  }
}
