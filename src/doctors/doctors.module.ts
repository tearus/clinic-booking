import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { SpecialtyModule } from '../specialty/specialty.module';

@Module({
  providers: [DoctorsService],
  controllers: [DoctorsController],
  exports: [DoctorsService],
  imports: [SpecialtyModule],
})
export class DoctorsModule {}
