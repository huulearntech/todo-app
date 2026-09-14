import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); // Use cookie-parser middleware to parse cookies

  // Enable CORS for your NextJS frontend URL
  app.enableCors({
    origin: 'http://localhost:3000', // Your Next.js dev server
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(4000); // Running on port 4000
}
bootstrap();