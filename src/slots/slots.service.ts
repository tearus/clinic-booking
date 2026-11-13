import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { PrismaService } from '../prisma/prisma.service';
import { DoctorsService } from '../doctors/doctors.service';

@Injectable()
export class SlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctorsService: DoctorsService,
  ) {}

  async create(dto: CreateSlotDto) {
    await this.doctorsService.findOne(dto.doctorId);
    const start = new Date(dto.startsAt);
    const end = new Date(dto.endsAt);
    this.ovelappingCheck(dto.doctorId, start, end);
    this.parseRange(start, end);
    return this.prisma.slot.create({
      data: {
        doctorId: dto.doctorId,
        startsAt: start,
        endsAt: end,
      },
      include: { doctor: true },
    });
  }
  private parseRange(startsAt: Date, endsAt: Date) {
    if (new Date(startsAt) >= new Date(endsAt)) {
      throw new BadRequestException('Дата начала должна быть раньше конца');
    }
  }
  private async ovelappingCheck(
    doctorId: number,
    startsAt: Date,
    endsAt: Date,
    excludeId?: number,
  ) {
    const overlapping = await this.prisma.slot.findFirst({
      where: {
        doctorId,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (overlapping) {
      throw new ConflictException('У врача уже есть слот в это время');
    }
  }
  findAll() {
    return this.prisma.slot.findMany({
      include: { doctor: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async findOne(id: number) {
    const slot = await this.prisma.slot.findUnique({
      where: { id },
      include: { doctor: true },
    });
    if (!slot) {
      throw new NotFoundException('Слот не найден');
    }
    return slot;
  }

  async update(id: number, dto: UpdateSlotDto) {
    const current = await this.findOne(id);
    if (current.isBooked) {
      throw new ConflictException('Слот уже занят');
    }
    const doctorId = dto.doctorId ?? current.doctorId;
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;

    await this.doctorsService.findOne(doctorId);
    this.parseRange(startsAt, endsAt);

    await this.ovelappingCheck(doctorId, startsAt, endsAt, id);
    return this.prisma.slot.update({
      where: { id },
      data: {
        doctorId,
        startsAt,
        endsAt,
      },
      include: { doctor: true },
    });
  }

  remove(id: number) {
    return this.prisma.slot.delete({ where: { id } });
  }
}
