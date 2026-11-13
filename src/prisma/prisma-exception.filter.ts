import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, message } = this.mapPrismaError(exception);

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
    });
  }

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (exception.code) {
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Запись не найдена' };
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Запись с такими данными уже существует',
        };
      case 'P2003':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Нельзя удалить запись: на неё ссылаются другие данные',
        };
      case 'P2000':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Значение слишком длинное для поля',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Внутренняя ошибка базы данных',
        };
    }
  }
}
