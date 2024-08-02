import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { microserviceOptions } from './microservice.config';

async function start() {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule);

  // Настройка Swagger
  const config = new DocumentBuilder()
    .setTitle('Trello')
    .setDescription('To do list')
    .addTag('Oceanic-Oracle')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document);

  // Настройка микросервиса
  app.connectMicroservice(microserviceOptions);

  await app.startAllMicroservices();
  await app.listen(PORT, () => {
    console.log(`Server started on port = ${PORT}`);
  });
}

start();