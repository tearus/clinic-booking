import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AppointmentsScheduler } from '../src/appointments/appointments.scheduler';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Запись на приём (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AppointmentsScheduler)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0);
    prisma = app.get(PrismaService);
    await Promise.all(
      Array.from(
        { length: 10 },
        () => prisma.$executeRaw`SELECT pg_sleep(0.05)`,
      ),
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await prisma.appointment.deleteMany();
    await prisma.slot.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.specialty.deleteMany();
  });

  const HOUR = 60 * 60 * 1000;

  async function createSlot(startsInHours = 100) {
    const specialty = await prisma.specialty.create({
      data: { name: 'Терапевт' },
    });
    const doctor = await prisma.doctor.create({
      data: { fullName: 'Тестовый Врач', specialtyId: specialty.id },
    });
    const startsAt = new Date(Date.now() + startsInHours * HOUR);
    return prisma.slot.create({
      data: {
        doctorId: doctor.id,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000),
      },
    });
  }

  const book = (slotId: number, n = 1) =>
    request(app.getHttpServer())
      .post('/appointments')
      .send({ slotId, fullName: `Пациент ${n}`, phone: '+31612345678' });

  it('при 10 одновременных запросах на один слот записывается ровно один', async () => {
    const slot = await createSlot();

    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, i) => book(slot.id, i)),
    );

    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(9);

    expect(await prisma.appointment.count({ where: { slotId: slot.id } })).toBe(
      1,
    );
    const after = await prisma.slot.findUniqueOrThrow({
      where: { id: slot.id },
    });
    expect(after.isBooked).toBe(true);
  });

  it('отмена освобождает слот, и на него можно записаться снова', async () => {
    const slot = await createSlot();

    const first = await book(slot.id, 1);
    expect(first.status).toBe(201);

    await request(app.getHttpServer())
      .post(`/appointments/${first.body.cancelToken}/cancel`)
      .expect(200);

    const freed = await prisma.slot.findUniqueOrThrow({
      where: { id: slot.id },
    });
    expect(freed.isBooked).toBe(false);

    const second = await book(slot.id, 2);
    expect(second.status).toBe(201);
  });

  it('повторная отмена не освобождает чужую запись', async () => {
    const slot = await createSlot();
    const first = await book(slot.id, 1);
    const token = first.body.cancelToken;

    await request(app.getHttpServer())
      .post(`/appointments/${token}/cancel`)
      .expect(200);
    await book(slot.id, 2).expect(201);

    await request(app.getHttpServer())
      .post(`/appointments/${token}/cancel`)
      .expect(409);

    const slotNow = await prisma.slot.findUniqueOrThrow({
      where: { id: slot.id },
    });
    expect(slotNow.isBooked).toBe(true);
  });
});
