import { Injectable } from "@nestjs/common";
import { User, UserService } from "../../user";
import {
  FAILED_RUN_STATUSES,
  SUCCESSFUL_RUN_STATUSES,
} from "../../openai/openai.constant";
import { messages } from "../../../resources/messages";
import { Context } from "telegraf";
import { Message } from "@telegraf/types";
import { OpenAIService } from "../../openai";
import { TelegramService } from "../../telegram";
import { BaseHandler } from "./base.handler";

@Injectable()
export class MessageHandler extends BaseHandler {
  constructor(
    private readonly userService: UserService,
    private readonly telegramService: TelegramService,
    private readonly openAIService: OpenAIService,
  ) {
    super();
  }

  protected async handle(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);
    if (!user.token) return ctx.replyWithHTML(messages.greeting);

    await this.initializeAssistantAndThread(user);
    await this.processMessage(user, ctx);
  }

  private async initializeAssistantAndThread(user: User) {
    if (user.assistantId && user.threadId) return;

    if (!user.assistantId) {
      user.assistantId = await this.openAIService.createAssistant({
        token: user.token,
      });
    }

    if (!user.threadId) {
      user.threadId = await this.openAIService.createThread({
        token: user.token,
      });
    }

    await this.userService.updateUser(user);
  }

  private async waitForResponse({
    chatId,
    user,
    runId,
  }: {
    chatId: number;
    user: User;
    runId: string;
  }) {
    const promise = new Promise<string>((resolve) => {
      // check run status every second
      const intervalId = setInterval(async () => {
        const run = await this.openAIService.getRun({
          runId,
          threadId: user.threadId,
          token: user.token,
        });

        // if run failed, stop checking and resolve with error message
        if (FAILED_RUN_STATUSES.includes(run.status)) {
          clearInterval(intervalId);
          resolve(messages.somethingWentWrong);
        }

        // if run succeeded, stop checking and resolve with response
        if (SUCCESSFUL_RUN_STATUSES.includes(run.status)) {
          clearInterval(intervalId);

          const messages = await this.openAIService.getMessages({
            threadId: user.threadId,
            token: user.token,
          });

          // if no response, resolve with error message
          const response = messages[0]?.content?.[0]?.text?.value;
          resolve(response || messages.somethingWentWrong);

          await this.userService.resetUserRun(user);
        }
      }, 1000);
    });

    await this.telegramService.sendAsyncMessage(
      chatId,
      messages.processing,
      promise,
    );
  }

  private async processMessage(user: User, ctx: Context) {
    const runId = await this.openAIService.sendMessage({
      threadId: user.threadId,
      assistantId: user.assistantId,
      content: `[date="${new Date().toISOString()}", user="${user.userId}"]\r\n
${(ctx.message as Message.TextMessage).text}`,
      token: user.token,
    });

    await this.waitForResponse({
      chatId: ctx.chat.id,
      user,
      runId,
    });
  }
}
