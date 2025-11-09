import { IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';

export class GetBalanceRequestDto {
  @Expose()
  @IsUUID()
  userId!: string;

  @Expose()
  @IsOptional()
  @IsISO8601()
  referenceDate?: string;
}
