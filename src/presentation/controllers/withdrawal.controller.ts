import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { RequestWithdrawalUseCase } from '../../application/use-cases/request-withdrawal.use-case';
import { RequestWithdrawalBodyDto } from '../dto/request-withdrawal.body.dto';
import { RequestWithdrawalRequestDto } from '../dto/request-withdrawal.request.dto';
import { RequestWithdrawalResponseDto } from '../dto/request-withdrawal.response.dto';

@Controller('users')
export class WithdrawalController {
  constructor(
    private readonly requestWithdrawalUseCase: RequestWithdrawalUseCase,
  ) {}

  @Post(':userId/withdrawals')
  async requestWithdrawal(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() body: RequestWithdrawalBodyDto,
  ): Promise<RequestWithdrawalResponseDto> {
    const request = new RequestWithdrawalRequestDto();
    request.userId = userId;
    request.type = body.type;
    request.requestedAmount = body.requestedAmount;
    request.requestId = body.requestId;
    request.requestedAt = body.requestedAt;
    request.notes = body.notes;

    const result = await this.requestWithdrawalUseCase.execute(request);

    const response = new RequestWithdrawalResponseDto();
    response.requestId = result.requestId;
    response.userId = result.userId;
    response.type = result.type;
    response.approvedAmount = result.approvedAmount;
    response.availableBalanceAfterRequest = result.availableBalanceAfterRequest;
    response.requestedAt = result.requestedAt;
    response.notes = result.notes;

    return response;
  }
}
