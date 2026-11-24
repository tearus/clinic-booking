import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AppointmentsScheduler } from '../src/appointments/appointments.scheduler';

describe('Rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DISABLE_THROTTLE = 'false';
    process.env.THROTTLE_LIMIT = '5';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AppointmentsScheduler)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('после лимита запросов сервер отвечает 429', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) {
      const res = await request(app.getHttpServer()).get('/doctors');
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses.slice(5).every((s) => s === 429)).toBe(true);
  });
});
