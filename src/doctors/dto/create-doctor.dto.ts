import { IsInt, IsString, MinLength } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @MinLength(3)
  fullName: string;

  @IsInt()
  specialtyId: number;
}
