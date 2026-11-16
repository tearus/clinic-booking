import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { SpecialtyService } from '../specialty/specialty.service';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly specialtyService: SpecialtyService,
  ) {}

  findAll() {
    return this.prisma.doctor.findMany({
      include: { specialty: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async create(dto: CreateDoctorDto) {
    await this.specialtyService.findOne(dto.specialtyId);
    return this.prisma.doctor.create({
      data: dto,
      include: { specialty: true },
    });
  }

  findOne(id: number) {
    return this.prisma.doctor.findUniqueOrThrow({
      where: { id },
      include: { specialty: true },
    });
  }
}
