import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendConfirmationRequest(a: {
    phone: string;
    cancelToken: string;
    slot: { startsAt: Date };
  }) {
    const base = process.env.APP_URL ?? 'http://localhost:3000';
    const link = `${base}/appointments/${a.cancelToken}`;
    // TODO: сделать нормальную отправку сообщений на почту/SMS/Telegram
    this.logger.debug(
      `SMS на ${a.phone}: подтвердите визит ${a.slot.startsAt.toISOString()}: ${link}`,
    );
  }
}
