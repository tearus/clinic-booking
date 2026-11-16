import {
  IsInt,
  IsPositive,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  @IsPositive()
  slotId: number;

  @IsString()
  @MinLength(3)
  fullName: string;

  @Matches(/^\+?[0-9\s\-()]{7,20}$/, { message: 'Некорректный номер телефона' })
  phone: string;
}
