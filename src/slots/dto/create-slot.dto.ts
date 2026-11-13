import { IsDateString, IsInt, IsISO8601, IsPositive } from 'class-validator';

export class CreateSlotDto {
  @IsInt()
  @IsPositive()
  doctorId: number;

  @IsDateString()
  @IsISO8601()
  startsAt: string;

  @IsDateString()
  @IsISO8601()
  endsAt: string;
}
