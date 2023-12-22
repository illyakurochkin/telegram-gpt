import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { Message } from '@telegraf/types';
import { OpenAIService } from '../openai';
import { UserService, User } from '../user';
import { messages } from '../../resources/messages';
import { TelegramService } from '../telegram';
import {
  FAILED_RUN_STATUSES,
  SUCCESSFUL_RUN_STATUSES,
} from '../openai/openai.constant';

@Injectable()
export class ChatBotService {
  private readonly logger = new Logger(ChatBotService.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly openAIService: OpenAIService,
    private readonly userService: UserService,
  ) {
    telegramService.registerCommand('start', this.handleStart.bind(this));
    telegramService.registerCommand('token', this.handleToken.bind(this));
    telegramService.registerCommand('reset', this.handleReset.bind(this));

    telegramService.registerMessageHandler(this.handleMessage.bind(this));
  }

  /**
   * Handle /start command
   * @param ctx
   */
  public async handleStart(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);
    this.logger.log(`user ${user.id} started the bot`);
    return ctx.replyWithHTML(messages.greeting);
  }

  /**
   * Handle /token command
   * @param ctx
   */
  public async handleToken(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);

    // token is the second argument
    const token = (ctx.message as Message.TextMessage).text?.split(' ')[1];
    if (!token) return ctx.replyWithHTML(messages.tokenRequired);

    const isValid = await this.openAIService.validateToken(token);
    if (!isValid) return ctx.replyWithHTML(messages.tokenRejected);

    await this.userService.setUserToken(user, token);
    return ctx.replyWithHTML(messages.tokenAccepted);
  }

  /**
   * Handle /reset command
   * @param ctx
   */
  public async handleReset(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);

    if (user.threadId) {
      await this.openAIService.deleteThread({
        threadId: user.threadId,
        token: user.token,
      });
    }

    // TODO: stop run

    await this.userService.resetUser(user);
    return ctx.replyWithHTML(messages.userReset);
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
      const intervalId = setInterval(async () => {
        const run = await this.openAIService.getRun({
          runId,
          threadId: user.threadId,
          token: user.token,
        });

        if (FAILED_RUN_STATUSES.includes(run.status)) {
          clearInterval(intervalId);
          resolve(messages.somethingWentWrong);
        }

        if (SUCCESSFUL_RUN_STATUSES.includes(run.status)) {
          clearInterval(intervalId);

          const messages = await this.openAIService.getMessages({
            threadId: user.threadId,
            token: user.token,
          });

          const response = messages[0]?.content?.[0]?.text?.value;
          resolve(response || messages.somethingWentWrong);

          user.runId = null;
          await this.userService.updateUser(user);
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
      content: (ctx.message as Message.TextMessage).text,
      token: user.token,
    });

    await this.waitForResponse({
      chatId: ctx.chat.id,
      user,
      runId,
    });
  }

  /**
   * Handle any telegram text message
   * @param ctx
   */
  public async handleMessage(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);
    if (!user.token) return ctx.replyWithHTML(messages.greeting);

    await this.initializeAssistantAndThread(user);
    await this.processMessage(user, ctx);
  }
}
