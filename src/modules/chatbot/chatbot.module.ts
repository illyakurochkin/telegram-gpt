import { Module } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ChatBotService } from './chatbot.service';
import { OpenAIModule } from '../openai/openai.module';
import { UserService } from '../user/user.service';

@Module({
  imports: [OpenAIModule],
  providers: [
    ChatBotService,
    {
      provide: Telegraf,
      useFactory: () => new Telegraf(process.env.TELEGRAM_BOT_TOKEN),
    },
    UserService,
  ],
  exports: [ChatBotService, Telegraf],
})
export class ChatBotModule {}
