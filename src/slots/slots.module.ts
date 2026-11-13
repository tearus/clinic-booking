import { Module } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';
import { DoctorsModule } from '../doctors/doctors.module';

@Module({
  controllers: [SlotsController],
  providers: [SlotsService],
  imports: [DoctorsModule],
})
export class SlotsModule {}
