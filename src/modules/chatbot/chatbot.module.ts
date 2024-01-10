import { Logger, Module } from '@nestjs/common';
import { OpenAIModule } from '../openai';
import { UserModule } from '../user';
import { TelegramModule } from '../telegram';
import { ChatBotService } from './chatbot.service';
import { ChatBotController } from './chatbot.controller';
import { StartHandler } from './handlers/start.handler';
import { TokenHandler } from './handlers/token.handler';
import { ResetHandler } from './handlers/reset.handler';
import { MessageHandler } from './handlers/message.handler';
import { AdminHandler } from './handlers/admin.handler';
import { NewMessageHandler } from './handlers/new-message.handler';
import { LangchainModule } from '../langchain/langchain.module';
import { LangchainService } from '../langchain/langchain.service';

@Module({
  imports: [OpenAIModule, UserModule, TelegramModule, LangchainModule],
  providers: [
    // services
    ChatBotService,
    LangchainService,
    Logger,

    // handlers
    StartHandler,
    TokenHandler,
    ResetHandler,
    AdminHandler,
    MessageHandler,

    // temp
    NewMessageHandler,
  ],
  exports: [ChatBotService],
  controllers: [ChatBotController],
})
export class ChatBotModule {}
