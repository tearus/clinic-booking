import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { REMINDER_BEFORE_MS } from './appointments.constants';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.slot.updateMany({
        where: {
          id: dto.slotId,
          isBooked: false,
          startsAt: { gt: new Date() },
        },
        data: { isBooked: true },
      });

      if (count === 0) {
        const exists = await tx.slot.findUnique({
          where: { id: dto.slotId },
          select: { id: true },
        });
        if (!exists) throw new NotFoundException('Слот не найден');
        throw new ConflictException('Слот уже занят или время прошло');
      }
      const slot = await tx.slot.findUniqueOrThrow({
        where: { id: dto.slotId },
        select: { startsAt: true },
      });

      const needsConfirmation =
        slot.startsAt.getTime() - Date.now() > REMINDER_BEFORE_MS;

      return tx.appointment.create({
        data: {
          slotId: dto.slotId,
          fullName: dto.fullName,
          phone: dto.phone,
          status: needsConfirmation ? 'ACTIVE' : 'CONFIRMED',
          confirmedAt: needsConfirmation ? null : new Date(),
        },
        select: { id: true, cancelToken: true, status: true, createdAt: true },
      });
    });
  }

  async findByToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { cancelToken: token },
      select: {
        status: true,
        fullName: true,
        slot: {
          select: {
            startsAt: true,
            endsAt: true,
            doctor: {
              select: {
                fullName: true,
                specialty: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!appointment) throw new NotFoundException('Запись не найдена');

    const inFuture = appointment.slot.startsAt > new Date();
    return {
      ...appointment,
      canConfirm: appointment.status === 'ACTIVE' && inFuture,
      canCancel:
        (appointment.status === 'ACTIVE' ||
          appointment.status === 'CONFIRMED') &&
        inFuture,
    };
  }

  async confirm(token: string) {
    const { count } = await this.prisma.appointment.updateMany({
      where: {
        cancelToken: token,
        status: 'ACTIVE',
        slot: { startsAt: { gt: new Date() } },
      },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });

    if (count === 0) {
      await this.ensureExists(token);
      throw new ConflictException(
        'Запись нельзя подтвердить: она уже подтверждена, отменена или срок истёк',
      );
    }
    return { status: 'CONFIRMED' as const };
  }

  async cancel(token: string) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { cancelToken: token },
        select: { id: true, slotId: true },
      });
      if (!appointment) throw new NotFoundException('Запись не найдена');

      const { count } = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          status: { in: ['ACTIVE', 'CONFIRMED'] },
          slot: { startsAt: { gt: new Date() } },
        },
        data: { status: 'CANCELLED' },
      });
      if (count === 0) {
        throw new ConflictException(
          'Запись нельзя отменить: она уже отменена, аннулирована или визит прошёл',
        );
      }

      await tx.slot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
      return { status: 'CANCELLED' as const };
    });
  }

  private async ensureExists(token: string) {
    const found = await this.prisma.appointment.findUnique({
      where: { cancelToken: token },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Запись не найдена');
  }
}
