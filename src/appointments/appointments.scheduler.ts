import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CONFIRM_DEADLINE_BEFORE_MS,
  REMINDER_BEFORE_MS,
} from './appointments.constants';

@Injectable()
export class AppointmentsScheduler {
  private readonly logger = new Logger(AppointmentsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders() {
    const now = Date.now();
    const due = await this.prisma.appointment.findMany({
      where: {
        status: 'ACTIVE',
        reminderSentAt: null,
        slot: {
          startsAt: {
            gt: new Date(now),
            lte: new Date(now + REMINDER_BEFORE_MS),
          },
        },
      },
      select: {
        id: true,
        phone: true,
        cancelToken: true,
        slot: { select: { startsAt: true } },
      },
    });
    this.logger.log(
      `sendReminders: now=${new Date(now).toISOString()}, due=${due.length}`,
    );
    for (const appointment of due) {
      const { count } = await this.prisma.appointment.updateMany({
        where: { id: appointment.id, reminderSentAt: null },
        data: { reminderSentAt: new Date() },
      });
      if (count === 0) continue;

      try {
        await this.notifications.sendConfirmationRequest(appointment);
      } catch (e) {
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSentAt: null },
        });

        this.logger.error(
          `Не удалось отправить напоминание #${appointment.id}`,
          e instanceof Error ? e.stack : String(e),
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async expireUnconfirmed() {
    const deadline = new Date(Date.now() + CONFIRM_DEADLINE_BEFORE_MS);
    const stale = await this.prisma.appointment.findMany({
      where: {
        status: 'ACTIVE',
        reminderSentAt: { not: null },
        slot: { startsAt: { lte: deadline } },
      },

      select: { id: true, slotId: true },
    });

    for (const { id, slotId } of stale) {
      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.appointment.updateMany({
          where: { id, status: 'ACTIVE' },
          data: { status: 'EXPIRED' },
        });
        if (count === 0) return;
        await tx.slot.update({
          where: { id: slotId },
          data: { isBooked: false },
        });
      });
    }
  }
}
