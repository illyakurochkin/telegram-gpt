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
import { TextToSpeechHandler } from './handlers/text-to-speech.handler';
import { SpeechToTextHandler } from './handlers/spech-to-text.handler';

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

    NewMessageHandler,
    TextToSpeechHandler,
    SpeechToTextHandler,
    MessageHandler,
  ],
  exports: [ChatBotService],
  controllers: [ChatBotController],
})
export class ChatBotModule {}
