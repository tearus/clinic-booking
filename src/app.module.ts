import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DoctorsModule } from './doctors/doctors.module';
import { SlotsModule } from './slots/slots.module';
import { SpecialtyModule } from './specialty/specialty.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    PrismaModule,
    DoctorsModule,
    SlotsModule,
    SpecialtyModule,
    AppointmentsModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: 60_000,
            limit: Number(process.env.THROTTLE_LIMIT ?? 100),
          },
        ],
        skipIf: () => process.env.DISABLE_THROTTLE === 'true',
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
