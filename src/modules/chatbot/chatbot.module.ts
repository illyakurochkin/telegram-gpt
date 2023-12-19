import { Logger, Module } from '@nestjs/common';
import { OpenAIModule } from '../openai';
import { UserModule } from '../user';
import { TelegramModule } from '../telegram';
import { ChatBotService } from './chatbot.service';

@Module({
  imports: [OpenAIModule, UserModule, TelegramModule],
  providers: [ChatBotService, Logger],
  exports: [ChatBotService],
})
export class ChatBotModule {}
