import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { TypedConfigService } from './config/typed-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); // Use cookie-parser middleware to parse cookies

  const configService = app.get(TypedConfigService);
  const frontendUrl =
    configService.get('FRONTEND_URL') || 'http://localhost:3000';
  const port = configService.get('PORT') || 4000;

  // Enable CORS for frontend URL
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(port);
}
bootstrap();

