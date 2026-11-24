import { BadRequestException } from '@nestjs/common';
import { DateTime, IANAZone } from 'luxon';

export const CLINIC_TZ = process.env.CLINIC_TIMEZONE ?? 'Europe/Moscow';

if (!IANAZone.isValidZone(CLINIC_TZ)) {
  throw new Error(`Неизвестный часовой пояс в CLINIC_TIMEZONE: ${CLINIC_TZ}`);
}

export function dayRange(date: string, zone: string = CLINIC_TZ) {
  const start = DateTime.fromISO(date, { zone }).startOf('day');
  if (!start.isValid) {
    throw new BadRequestException('Некорректная дата');
  }
  return {
    from: start.toJSDate(),
    to: start.plus({ days: 1 }).toJSDate(),
  };
}
