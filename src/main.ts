import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {});
  app.enableShutdownHooks();

  configureApp(app);

  const config = new DocumentBuilder()
    .setTitle('Clinic API')
    .setDescription('API для записи на приём')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  new Logger('BootStrap').debug(`Listening on port ${port}`);
}
void bootstrap();
