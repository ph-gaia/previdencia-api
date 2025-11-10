import { IUseCase } from '../interfaces/i.use-case';
import { RequestWithdrawalInputDto } from '../dto/request-withdrawal.dto';
import { WithdrawalResponseDto } from '../dto/withdrawal-response.dto';
import { UserRepository } from '../../domain/repositories/user-repository.interface';
import { ContributionRepository } from '../../domain/repositories/contribution-repository.interface';
import { WithdrawalValidatorService } from '../../domain/services/withdrawal-validator.service';
import { BalanceCalculatorService } from '../../domain/services/balance-calculator.service';
import { WithdrawalRequest } from '../../domain/entities/withdrawal-request.entity';
import { Money } from '../../domain/value-objects/money.vo';
import {
  WithdrawalPersistencePort,
  WithdrawalPersistenceInput,
} from '../services/withdrawal-persistence.port';

export class RequestWithdrawalUseCase
  implements IUseCase<RequestWithdrawalInputDto, WithdrawalResponseDto>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly contributionRepository: ContributionRepository,
    private readonly withdrawalValidator: WithdrawalValidatorService = new WithdrawalValidatorService(),
    private readonly balanceCalculator: BalanceCalculatorService = new BalanceCalculatorService(),
    private readonly withdrawalPersistence?: WithdrawalPersistencePort,
  ) {}

  async execute(
    input: RequestWithdrawalInputDto,
  ): Promise<WithdrawalResponseDto> {
    this.ensureUserId(input.userId);

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const contributions = await this.contributionRepository.findByUserId(
      user.getId(),
    );
    const requestedAt = this.parseDateOrNow(input.requestedAt, 'requestedAt');
    const requestedAmount = this.toMoneyOrUndefined(input.requestedAmount);

    const withdrawalRequest = new WithdrawalRequest({
      id: input.requestId ?? this.generateRequestId(),
      userId: user.getId(),
      type: input.type,
      requestedAmount,
      requestedAt,
      notes: input.notes,
    });

    const approvedAmount = this.withdrawalValidator.validate(
      withdrawalRequest,
      contributions,
      requestedAt,
    );
    const balanceSummary = this.balanceCalculator.calculateSummary(
      contributions,
      requestedAt,
    );
    const availableAfterRequest =
      balanceSummary.available.subtract(approvedAmount);

    await this.persistWithdrawal({
      withdrawalId: withdrawalRequest.getId(),
      userId: withdrawalRequest.getUserId(),
      type: withdrawalRequest.getType(),
      approvedAmount: approvedAmount.amount,
      requestedAmount: requestedAmount?.amount,
      requestedAt,
      notes: withdrawalRequest.getNotes(),
    });

    return {
      requestId: withdrawalRequest.getId(),
      userId: withdrawalRequest.getUserId(),
      type: withdrawalRequest.getType(),
      approvedAmount: approvedAmount.amount,
      availableBalanceAfterRequest: availableAfterRequest.amount,
      requestedAt: withdrawalRequest.getRequestedAt().toISOString(),
      notes: withdrawalRequest.getNotes(),
    };
  }

  private ensureUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('userId is required');
    }
  }

  private parseDateOrNow(dateString: string | undefined, field: string): Date {
    if (!dateString) {
      return new Date();
    }

    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid ${field}`);
    }

    return parsed;
  }

  private toMoneyOrUndefined(amount?: number): Money | undefined {
    if (amount === undefined) {
      return undefined;
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new Error('Invalid requestedAmount');
    }

    return new Money(amount);
  }

  private generateRequestId(): string {
    return `wr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private async persistWithdrawal(
    payload: WithdrawalPersistenceInput,
  ): Promise<void> {
    if (!this.withdrawalPersistence) {
      return;
    }

    await this.withdrawalPersistence.process(payload);
  }
}
