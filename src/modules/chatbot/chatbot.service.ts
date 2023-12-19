import { Injectable, Logger } from '@nestjs/common';
import { Context, Scenes } from 'telegraf';
import { Message } from '@telegraf/types/message';
import { OpenAIService } from '../openai';
import { UserService, User } from '../user';
import { messages } from '../../resources/messages';
import { TelegramService } from '../telegram';
import { FAILED_RUN_STATUSES, SUCCESSFUL_RUN_STATUSES } from "../openai/openai.constant";

@Injectable()
export class ChatBotService {
  private readonly logger = new Logger(ChatBotService.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly openAIService: OpenAIService,
    private readonly userService: UserService,
  ) {
    const stage = new Scenes.Stage([

    ])

    const scene = new Scenes.

    telegramService.registerCommand('start', this.handleStart.bind(this));
    telegramService.registerCommand('token', this.handleToken.bind(this));
    telegramService.registerCommand('reset', this.handleReset.bind(this));
    telegramService.registerMessageHandler(this.handleMessage.bind(this));
  }

  public async handleStart(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);
    this.logger.log(`user ${user.id} started the bot`);
    return ctx.replyWithHTML(messages.greeting);
  }

  public async handleToken(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);

    // token is the second argument
    const token = (ctx.message as Message.TextMessage).text?.split(' ')[1];

    const isValid = await this.openAIService.validateToken(token);
    if (!isValid) return ctx.reply(messages.tokenRejected);

    await this.userService.setUserToken(user, token);

    return ctx.reply(messages.tokenAccepted);
  }

  private async handleReset(ctx: Context) {
    await ctx.reply('Resetting...');

    const user = await this.userService.findOrCreateUser(ctx.from.id);

    if (user.threadId) {
      await this.openAIService.deleteThread({
        threadId: user.threadId,
        token: user.token,
      });
    }

    // TODO: stop run

    await this.userService.resetUser(user);

    return ctx.reply('Reset complete.');
  }

  private async initializeAssistantAndThread(user: User, ctx: Context) {
    if (!user.assistantId || !user.threadId) {
      if (!user.assistantId) {
        await ctx.reply('Creating assistant...');
        user.assistantId = await this.openAIService.createAssistant({
          token: user.token,
        });
        await ctx.reply('Assistant created.');
      }

      if (!user.threadId) {
        await ctx.reply('Creating thread...');
        user.threadId = await this.openAIService.createThread({
          token: user.token,
        });
        await ctx.reply('Thread created.');
      }

      await ctx.reply('Saving user...');
      await this.userService.updateUser(user);
      await ctx.reply('User saved.');
    }
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
          resolve('something went wrong.');
        }

        if (SUCCESSFUL_RUN_STATUSES.includes(run.status)) {
          clearInterval(intervalId);

          const messages = await this.openAIService.getMessages({
            threadId: user.threadId,
            token: user.token,
          });

          const response = messages[0]?.content?.[0]?.text?.value;
          if (response?.length) {
            resolve(response);
          } else {
            resolve('something went wrong.');
          }

          user.runId = null;
          await this.userService.updateUser(user);
        }
      }, 1000);
    });

    await this.telegramService.sendAsyncMessage(
      chatId,
      'processing...',
      promise,
    );
  }

  private async processMessage(user: User, ctx: Context) {
    const runId = await this.openAIService.sendMessage({
      threadId: user.threadId,
      assistantId: user.assistantId,
      content: (ctx.message as any).text,
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

    if (!user.token) {
      return ctx.replyWithMarkdownV2(
        'Please set your API token first by typing "/token <YOUR_OPENAI_TOKEN>"',
      );
    }

    await this.initializeAssistantAndThread(user, ctx);
    await this.processMessage(user, ctx);
  }
}
