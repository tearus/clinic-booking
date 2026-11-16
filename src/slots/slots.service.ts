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
import { FindSlotsQueryDto } from './dto/slots-list-query.dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class SlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctorsService: DoctorsService,
  ) {}

  private parseRange(startsAt: Date, endsAt: Date) {
    if (new Date(startsAt) >= new Date(endsAt)) {
      throw new BadRequestException('Дата начала должна быть раньше конца');
    }
  }
  private async overlappingCheck(
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

  async create(dto: CreateSlotDto) {
    await this.doctorsService.findOne(dto.doctorId);
    const start = new Date(dto.startsAt);
    const end = new Date(dto.endsAt);
    this.parseRange(start, end);
    await this.overlappingCheck(dto.doctorId, start, end);
    return this.prisma.slot.create({
      data: {
        doctorId: dto.doctorId,
        startsAt: start,
        endsAt: end,
      },
      include: { doctor: true },
    });
  }

  findFiltered(query: FindSlotsQueryDto) {
    const where: Prisma.SlotWhereInput = {};

    if (query.doctorId !== undefined) {
      where.doctorId = query.doctorId;
    }

    let from: Date | undefined;
    let to: Date | undefined;

    if (query.date) {
      from = new Date(`${query.date}T00:00:00.000Z`);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException('Некорректная дата');
      }
      to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    }

    if (query.onlyFree) {
      where.isBooked = false;
      const now = new Date();
      if (!from || from < now) {
        from = now;
      }
    }

    if (from || to) {
      where.startsAt = { gte: from, lt: to };
    }

    return this.prisma.slot.findMany({
      where,
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

    await this.overlappingCheck(doctorId, startsAt, endsAt, id);
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
