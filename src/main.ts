import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ChatBotService } from './modules/chatbot/chatbot.service';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const chatBotService = app.get(ChatBotService);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  await chatBotService.launch();

  console.log(`listening on port ${port}`);
}

bootstrap();
