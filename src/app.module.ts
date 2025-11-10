import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
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
import {
  USER_BALANCE_PROJECTION_REPOSITORY,
  UserBalanceProjectionRepository,
} from './domain/repositories/user-balance-projection.repository';
import { UserBalanceTypeOrmRepository } from './infrastructure/repositories/user-balance.typeorm.repository';
import { UserBalanceProjector } from './application/projections/user-balance.projector';
import { RecalculateUserBalanceHandler } from './application/cqrs/handlers/recalculate-user-balance.handler';
import { ContributionSavedEventHandler } from './application/cqrs/handlers/contribution-saved.handler';
import { WithdrawalProcessedEventHandler } from './application/cqrs/handlers/withdrawal-processed.handler';

const CQRS_COMMAND_HANDLERS: Provider[] = [RecalculateUserBalanceHandler];
const CQRS_EVENT_HANDLERS: Provider[] = [
  ContributionSavedEventHandler,
  WithdrawalProcessedEventHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [BalanceController, WithdrawalController],
  providers: [
    {
      provide: DataSource,
      useFactory: (): Promise<DataSource> => initializeDataSource(),
    },
    {
      provide: USER_REPOSITORY,
      useExisting: UserTypeOrmRepository,
    },
    {
      provide: CONTRIBUTION_REPOSITORY,
      useExisting: ContributionTypeOrmRepository,
    },
    {
      provide: USER_BALANCE_PROJECTION_REPOSITORY,
      useExisting: UserBalanceTypeOrmRepository,
    },
    UserTypeOrmRepository,
    ContributionTypeOrmRepository,
    UserBalanceTypeOrmRepository,
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
        userBalanceProjectionRepository: UserBalanceProjectionRepository,
      ): GetBalanceUseCase =>
        new GetBalanceUseCase(
          userRepository,
          contributionRepository,
          balanceCalculator,
          userBalanceProjectionRepository,
        ),
      inject: [
        USER_REPOSITORY,
        CONTRIBUTION_REPOSITORY,
        BalanceCalculatorService,
        USER_BALANCE_PROJECTION_REPOSITORY,
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
    UserBalanceProjector,
    ...CQRS_COMMAND_HANDLERS,
    ...CQRS_EVENT_HANDLERS,
  ],
})
export class AppModule {}
