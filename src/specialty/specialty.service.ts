import { Injectable } from '@nestjs/common';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpecialtyService {
  constructor(private readonly prisma: PrismaService) {}
  create(createSpecialtyDto: CreateSpecialtyDto) {
    return this.prisma.specialty.create({ data: createSpecialtyDto });
  }

  findAll() {
    return this.prisma.specialty.findMany();
  }

  findOne(id: number) {
    return this.prisma.specialty.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateSpecialtyDto) {
    return this.prisma.specialty.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.specialty.delete({ where: { id } });
  }
}
