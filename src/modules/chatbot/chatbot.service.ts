import { Injectable, Logger } from "@nestjs/common";
import { OpenAIService } from "../openai";
import { UserService } from "../user";
import { TelegramService } from "../telegram";
import { StartHandler } from "./handlers/start.handler";
import { TokenHandler } from "./handlers/token.handler";
import { ResetHandler } from "./handlers/reset.handler";
import { AdminHandler } from "./handlers/admin.handler";
import { NewMessageHandler } from "./handlers/new-message.handler";
import { TextToSpeechHandler } from "./handlers/text-to-speech.handler";
import { SpeechToTextHandler } from "./handlers/spech-to-text.handler";

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
    private readonly speechToTextHandler: SpeechToTextHandler,
  ) {
    telegramService.registerCommand(
      "start",
      startHandler.handleMessage.bind(startHandler),
    );
    telegramService.registerCommand(
      "token",
      tokenHandler.handleMessage.bind(tokenHandler),
    );
    telegramService.registerCommand(
      "reset",
      resetHandler.handleMessage.bind(resetHandler),
    );
    telegramService.registerCommand(
      "admin",
      adminHandler.handleMessage.bind(adminHandler),
    );
    telegramService.registerCommand(
      "v",
      textToSpeechHandler.handleMessage.bind(textToSpeechHandler),
    );
    telegramService.registerCommand(
      "voice",
      textToSpeechHandler.handleMessage.bind(textToSpeechHandler),
    );
    telegramService.registerMessageHandler((ctx) => {
      if ("text" in ctx.message) return newMessageHandler.handleMessage(ctx);
      if ("voice" in ctx.message) return speechToTextHandler.handleMessage(ctx);
    });

    this.logger.log("ChatBotService initialized");
  }
}
