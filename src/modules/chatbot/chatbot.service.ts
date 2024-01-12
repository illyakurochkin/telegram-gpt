import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../openai';
import { UserService } from '../user';
import { TelegramService } from '../telegram';
import { StartHandler } from './handlers/start.handler';
import { TokenHandler } from './handlers/token.handler';
import { ResetHandler } from './handlers/reset.handler';
import { AdminHandler } from './handlers/admin.handler';
import { NewMessageHandler } from './handlers/new-message.handler';
import { TextToSpeechHandler } from './handlers/text-to-speech.handler';

@Injectable()
export class ChatBotService {
  private readonly logger = new Logger(ChatBotService.name);

  constructor(
    // services
    private readonly telegramService: TelegramService,
    private readonly openAIService: OpenAIService,
    private readonly userService: UserService,
    // handlers
    private readonly startHandler: StartHandler,
    private readonly tokenHandler: TokenHandler,
    private readonly resetHandler: ResetHandler,
    private readonly adminHandler: AdminHandler,
    private readonly newMessageHandler: NewMessageHandler,
    private readonly textToSpeechHandler: TextToSpeechHandler,
  ) {
    telegramService.registerCommand(
      'start',
      startHandler.handle.bind(startHandler),
    );
    telegramService.registerCommand(
      'token',
      tokenHandler.handle.bind(tokenHandler),
    );
    telegramService.registerCommand(
      'reset',
      resetHandler.handle.bind(resetHandler),
    );
    telegramService.registerCommand(
      'admin',
      adminHandler.handle.bind(adminHandler),
    );
    telegramService.registerCommand(
      'v',
      textToSpeechHandler.handle.bind(textToSpeechHandler),
    );
    telegramService.registerMessageHandler(
      newMessageHandler.handle.bind(newMessageHandler),
    );

    this.logger.log('ChatBotService initialized');
  }
}
