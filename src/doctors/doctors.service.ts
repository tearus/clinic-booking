import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.doctor.findMany({
      include: { specialty: true },
    });
  }

  async create(dto: CreateDoctorDto) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id: dto.specialtyId },
    });
    if (!specialty) {
      throw new NotFoundException('Специальность не найдена');
    }

    return this.prisma.doctor.create({
      data: dto,
      include: { specialty: true },
    });
  }
  async findOne(id: number) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: { specialty: true },
    });
    if (!doctor) {
      throw new NotFoundException('Доктор не найден');
    }
    return doctor;
  }
}
