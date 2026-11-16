import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsScheduler } from './appointments.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsScheduler],
  imports: [NotificationsModule],
})
export class AppointmentsModule {}
