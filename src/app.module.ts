import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BalanceController } from './presentation/controllers/balance.controller';
import { WithdrawalController } from './presentation/controllers/withdrawal.controller';
import { initializeDataSource } from './infrastructure/database/data-source';
import { UserTypeOrmRepository } from './infrastructure/repositories/user.typeorm.repository';
import { ContributionTypeOrmRepository } from './infrastructure/repositories/contribution.typeorm.repository';
import {
  USER_REPOSITORY,
  UserRepository,
} from './domain/repositories/user-repository.interface';
import {
  CONTRIBUTION_REPOSITORY,
  ContributionRepository,
} from './domain/repositories/contribution-repository.interface';
import { GetBalanceUseCase } from './application/use-cases/get-balance.use-case';
import { RequestWithdrawalUseCase } from './application/use-cases/request-withdrawal.use-case';
import { BalanceCalculatorService } from './domain/services/balance-calculator.service';
import { WithdrawalValidatorService } from './domain/services/withdrawal-validator.service';

const DATA_SOURCE = 'DATA_SOURCE';

@Module({
  controllers: [BalanceController, WithdrawalController],
  providers: [
    {
      provide: DATA_SOURCE,
      useFactory: async (): Promise<DataSource> => initializeDataSource(),
    },
    {
      provide: UserTypeOrmRepository,
      useFactory: (dataSource: DataSource) =>
        new UserTypeOrmRepository(dataSource),
      inject: [DATA_SOURCE] as const,
    },
    {
      provide: USER_REPOSITORY,
      useExisting: UserTypeOrmRepository,
    },
    {
      provide: ContributionTypeOrmRepository,
      useFactory: (dataSource: DataSource) =>
        new ContributionTypeOrmRepository(dataSource),
      inject: [DATA_SOURCE] as const,
    },
    {
      provide: CONTRIBUTION_REPOSITORY,
      useExisting: ContributionTypeOrmRepository,
    },
    BalanceCalculatorService,
    {
      provide: WithdrawalValidatorService,
      useFactory: (
        balanceCalculator: BalanceCalculatorService,
      ): WithdrawalValidatorService =>
        new WithdrawalValidatorService(balanceCalculator),
      inject: [BalanceCalculatorService] as const,
    },
    {
      provide: GetBalanceUseCase,
      useFactory: (
        userRepository: UserRepository,
        contributionRepository: ContributionRepository,
        balanceCalculator: BalanceCalculatorService,
      ): GetBalanceUseCase =>
        new GetBalanceUseCase(
          userRepository,
          contributionRepository,
          balanceCalculator,
        ),
      inject: [
        USER_REPOSITORY,
        CONTRIBUTION_REPOSITORY,
        BalanceCalculatorService,
      ] as const,
    },
    {
      provide: RequestWithdrawalUseCase,
      useFactory: (
        userRepository: UserRepository,
        contributionRepository: ContributionRepository,
        withdrawalValidator: WithdrawalValidatorService,
        balanceCalculator: BalanceCalculatorService,
      ): RequestWithdrawalUseCase =>
        new RequestWithdrawalUseCase(
          userRepository,
          contributionRepository,
          withdrawalValidator,
          balanceCalculator,
        ),
      inject: [
        USER_REPOSITORY,
        CONTRIBUTION_REPOSITORY,
        WithdrawalValidatorService,
        BalanceCalculatorService,
      ] as const,
    },
  ],
})
export class AppModule {}
