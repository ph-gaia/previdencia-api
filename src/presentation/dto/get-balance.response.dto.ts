import { Expose } from 'class-transformer';

export class GetBalanceResponseDto {
  @Expose()
  userId!: string;

  @Expose()
  total!: number;

  @Expose()
  available!: number;
}
