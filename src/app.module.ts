import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DoctorsModule } from './doctors/doctors.module';
import { SlotsModule } from './slots/slots.module';

@Module({
  imports: [PrismaModule, DoctorsModule, SlotsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
