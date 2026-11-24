import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get(':token')
  findByToken(@Param('token', ParseUUIDPipe) token: string) {
    return this.appointmentsService.findByToken(token);
  }

  @Post(':token/confirm')
  @HttpCode(200)
  confirm(@Param('token', ParseUUIDPipe) token: string) {
    return this.appointmentsService.confirm(token);
  }

  @Post(':token/cancel')
  @HttpCode(200)
  cancel(@Param('token', ParseUUIDPipe) token: string) {
    return this.appointmentsService.cancel(token);
  }
}
