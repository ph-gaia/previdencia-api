import { Expose } from 'class-transformer';
import { IsISO8601, IsOptional } from 'class-validator';

export class GetBalanceQueryDto {
  @Expose()
  @IsOptional()
  @IsISO8601()
  referenceDate?: string;
}
