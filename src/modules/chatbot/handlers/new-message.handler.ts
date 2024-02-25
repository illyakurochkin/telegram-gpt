import { Injectable, Logger } from "@nestjs/common";
import { Context } from "telegraf";
import { UserService } from "../../user";
import { LangchainService } from "../../langchain/langchain.service";
import { TelegramService } from "../../telegram";
import { messages } from "../../../resources/messages";
import { BaseHandler } from "./base.handler";

@Injectable()
export class NewMessageHandler extends BaseHandler {
  private readonly logger = new Logger(NewMessageHandler.name);

  constructor(
    private readonly userService: UserService,
    private readonly langchainService: LangchainService,
    private readonly telegramService: TelegramService,
  ) {
    super();
  }

  protected async handle(ctx: Context) {
    if (!("text" in ctx.message)) {
      this.logger.log("ignoring non-text message");
      return;
    }

    this.logger.log("processing new message: ", ctx.message.text);

    await this.telegramService.startTyping(ctx.from.id);

    const user = await this.userService.findOrCreateUser(ctx.from.id);
    if (!user.token) {
      this.logger.log("user does not have a token");
      return ctx.replyWithHTML(messages.greeting);
    }

    await this.telegramService.startTyping(ctx.from.id);

    const messagesStream = await this.langchainService.executeMessage({
      userId: user.userId,
      token: user.token,
      message: ctx.message.text,
    });

    await this.telegramService.startTyping(ctx.from.id);

    await this.telegramService.sendAsyncMessagesStream(
      ctx.from.id,
      messagesStream,
    );
  }
}
