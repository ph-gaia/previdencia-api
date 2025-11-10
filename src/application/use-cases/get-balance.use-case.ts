import { IUseCase } from '../interfaces/i.use-case';
import {
  GetBalanceInputDto,
  GetBalanceOutputDto,
} from '../dto/get-balance.dto';
import { UserRepository } from '../../domain/repositories/user-repository.interface';
import { ContributionRepository } from '../../domain/repositories/contribution-repository.interface';
import { BalanceCalculatorService } from '../../domain/services/balance-calculator.service';
import {
  UserBalanceProjectionRepository,
  UserBalanceProjection,
} from '../../domain/repositories/user-balance-projection.repository';

export class GetBalanceUseCase
  implements IUseCase<GetBalanceInputDto, GetBalanceOutputDto>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly contributionRepository: ContributionRepository,
    private readonly balanceCalculator: BalanceCalculatorService,
    private readonly balanceProjectionRepository: UserBalanceProjectionRepository,
  ) {}

  async execute(input: GetBalanceInputDto): Promise<GetBalanceOutputDto> {
    this.ensureUserId(input.userId);

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const referenceDate = this.parseReferenceDate(input.referenceDate);
    const shouldUseProjection = !input.referenceDate;

    if (shouldUseProjection) {
      const projection = await this.tryGetProjection(user.getId());
      if (projection) {
        return {
          userId: projection.userId,
          total: projection.totalAmount,
          available: projection.availableAmount,
        };
      }
    }

    const contributions = await this.contributionRepository.findByUserId(
      user.getId(),
    );
    const balanceSummary = this.balanceCalculator.calculateSummary(
      contributions,
      referenceDate,
    );

    const response = {
      userId: user.getId(),
      total: balanceSummary.total.amount,
      available: balanceSummary.available.amount,
    };

    if (shouldUseProjection) {
      await this.balanceProjectionRepository.upsert({
        userId: response.userId,
        totalAmount: response.total,
        availableAmount: response.available,
        lockedAmount: Math.max(
          0,
          Number((response.total - response.available).toFixed(2)),
        ),
        calculatedAt: new Date(),
      });
    }

    return response;
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

  private async tryGetProjection(
    userId: string,
  ): Promise<UserBalanceProjection | null> {
    const projection =
      await this.balanceProjectionRepository.findByUserId(userId);

    if (!projection) {
      return null;
    }

    return projection;
  }
}
