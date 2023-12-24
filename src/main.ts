import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { TelegramService } from './modules/telegram';
import { AppModule } from './app.module';
import 'dotenv/config';
import { LoggerService } from './modules/logger/logger.service';

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(AppModule);

  // Get services from the app container
  const chatBotService = app.get(TelegramService);
  const logger = app.get(LoggerService);

  // Extract environment variables
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const port = process.env.PORT || 3000;

  if (webhookUrl) {
    // Start the bot in webhook mode
    await app.listen(port);
    await chatBotService.launchWebhook(webhookUrl);
    logger.log(`Webhook bot started, listening on port ${port}`, 'Bootstrap');
  } else {
    // Start the bot in polling mode
    logger.log('Long polling bot started', 'Bootstrap');
    await chatBotService.launchPolling();
  }
}

bootstrap();
