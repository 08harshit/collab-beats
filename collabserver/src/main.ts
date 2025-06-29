import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Configure CORS based on environment
  const allowedOrigins = configService.get<string>('NODE_ENV') === 'production'
    ? [configService.get<string>('FRONTEND_URL', 'http://localhost:3000')]
    : '*';

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
