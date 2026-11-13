import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SPECIALTIES = ['Терапевт', 'Кардиолог', 'Невролог', 'Педиатр'];

const DOCTORS: Array<{ fullName: string; specialty: string }> = [
  { fullName: 'Иванов Иван Иванович', specialty: 'Терапевт' },
  { fullName: 'Петрова Мария Сергеевна', specialty: 'Кардиолог' },
  { fullName: 'Сидоров Алексей Петрович', specialty: 'Невролог' },
  { fullName: 'Кузнецова Анна Владимировна', specialty: 'Педиатр' },
  { fullName: 'Смирнов Дмитрий Олегович', specialty: 'Терапевт' },
];

const SLOT_TIMES = [
  { hour: 10, minute: 0 },
  { hour: 11, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 15, minute: 30 },
];

const SLOT_DURATION_MIN = 30;
const BUSINESS_DAYS_AHEAD = 5;

function getNextBusinessDays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
  }
  return days;
}

async function seedSpecialties() {
  for (const name of SPECIALTIES) {
    await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ ${SPECIALTIES.length} specialties`);
}

async function seedDoctors() {
  const all = await prisma.specialty.findMany();
  const idByName = new Map(all.map((s) => [s.name, s.id]));

  for (const doc of DOCTORS) {
    const specialtyId = idByName.get(doc.specialty);
    if (!specialtyId) {
      console.warn(`⚠ Unknown specialty "${doc.specialty}" for ${doc.fullName}`);
      continue;
    }
    const exists = await prisma.doctor.findFirst({
      where: { fullName: doc.fullName },
    });
    if (exists) continue;
    await prisma.doctor.create({
      data: { fullName: doc.fullName, specialtyId },
    });
  }
  console.log(`✓ ${DOCTORS.length} doctors`);
}

async function seedSlots() {
  const doctors = await prisma.doctor.findMany();
  const days = getNextBusinessDays(BUSINESS_DAYS_AHEAD);
  let count = 0;

  for (const doctor of doctors) {
    for (const day of days) {
      for (const time of SLOT_TIMES) {
        const startsAt = new Date(day);
        startsAt.setHours(time.hour, time.minute, 0, 0);
        const endsAt = new Date(startsAt);
        endsAt.setMinutes(endsAt.getMinutes() + SLOT_DURATION_MIN);

        await prisma.slot.upsert({
          where: {
            doctorId_startsAt: { doctorId: doctor.id, startsAt },
          },
          update: {},
          create: { doctorId: doctor.id, startsAt, endsAt },
        });
        count++;
      }
    }
  }
  console.log(
    `✓ ${count} slots (${doctors.length} doctors × ${days.length} days × ${SLOT_TIMES.length} times)`,
  );
}

async function main() {
  console.log('🌱 Seeding...\n');
  await seedSpecialties();
  await seedDoctors();
  await seedSlots();
  console.log('\n✅ Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
