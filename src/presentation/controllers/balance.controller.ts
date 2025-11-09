import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { GetBalanceQueryDto } from '../dto/get-balance.query.dto';
import { GetBalanceRequestDto } from '../dto/get-balance.request.dto';
import { GetBalanceResponseDto } from '../dto/get-balance.response.dto';

@Controller('users')
export class BalanceController {
  constructor(private readonly getBalanceUseCase: GetBalanceUseCase) {}

  @Get(':userId/balance')
  async getBalance(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Query() query: GetBalanceQueryDto,
  ): Promise<GetBalanceResponseDto> {
    const request = new GetBalanceRequestDto();
    request.userId = userId;
    request.referenceDate = query.referenceDate;

    const result = await this.getBalanceUseCase.execute(request);

    const response = new GetBalanceResponseDto();
    response.userId = result.userId;
    response.total = result.total;
    response.available = result.available;

    return response;
  }
}
