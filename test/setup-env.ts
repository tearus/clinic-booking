process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://clinic:clinic@localhost:5432/clinic_test';
process.env.DISABLE_THROTTLE = 'true';
const dbName = new URL(process.env.DATABASE_URL).pathname;
if (!/test/i.test(dbName)) {
  throw new Error(
    `Тесты должны идти в базу с "test" в имени, а не в ${dbName}`,
  );
}
