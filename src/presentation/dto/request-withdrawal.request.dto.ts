import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { WithdrawalType } from '../../domain/domain.types';

export class RequestWithdrawalRequestDto {
  @Expose()
  @IsUUID()
  userId!: string;

  @Expose()
  @IsEnum(WithdrawalType)
  type!: WithdrawalType;

  @Expose()
  @ValidateIf((dto) => dto.type === WithdrawalType.PARTIAL)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  requestedAmount?: number;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  requestId?: string;

  @Expose()
  @IsOptional()
  @IsISO8601()
  requestedAt?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  notes?: string;
}

