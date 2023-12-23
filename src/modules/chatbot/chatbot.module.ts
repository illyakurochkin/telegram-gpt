import { Logger, Module } from '@nestjs/common';
import { OpenAIModule } from '../openai';
import { UserModule } from '../user';
import { TelegramModule } from '../telegram';
import { ChatBotService } from './chatbot.service';
import { ChatBotController } from './chatbot.controller';

@Module({
  imports: [OpenAIModule, UserModule, TelegramModule],
  providers: [ChatBotService, Logger],
  exports: [ChatBotService],
  controllers: [ChatBotController],
})
export class ChatBotModule {}
