# Clinic API

REST API для сайта медицинской клиники: пациенты записываются на приём к врачу без регистрации, достаточно указать ФИО и телефон.

## Стек

NestJS · TypeScript · PostgreSQL · Prisma · Swagger · Docker Compose

## Возможности

- [x] Список врачей со специальностями
- [x] Добавление врача, валидация входных данных (class-validator)
- [x] Swagger-документация на `/docs`
- [ ] Свободные слоты врача и календарь по дням
- [ ] Запись на приём с защитой от двойного бронирования
- [ ] Отмена записи по персональной ссылке (без аккаунта)
- [ ] Админка с JWT и ролями
- [ ] Подтверждение телефона, rate limiting
- [ ] Тесты

## Быстрый старт

Нужны Node.js 22+ и Docker.

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

API: <http://localhost:3000>, документация: <http://localhost:3000/docs>

## Основные эндпоинты

| Метод | Адрес          | Описание       |
| ----- | -------------- | -------------- |
| GET   | `/doctors`     | Список врачей  |
| GET   | `/doctors/:id` | Врач по id     |
| POST  | `/doctors`     | Добавить врача |

## Структура

```
src/
  prisma/    # подключение к БД (PrismaService)
  doctors/   # контроллер, сервис, DTO
prisma/
  schema.prisma
  migrations/
```
