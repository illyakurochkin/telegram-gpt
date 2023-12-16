import { Injectable } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { Message } from '@telegraf/types/message';
import { URL } from 'url';
import { OpenAIService } from '../openai/openai.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

@Injectable()
export class ChatBotService {
  constructor(
    private readonly telegraf: Telegraf,
    private readonly openAIService: OpenAIService,
    private readonly userService: UserService,
  ) {
    telegraf.command('start', this.handleStart.bind(this));
    telegraf.command('token', this.handleToken.bind(this));
    telegraf.command('reset', this.handleReset.bind(this));
    telegraf.on('message', this.handleMessage.bind(this));
  }

  public async handleStart(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);

    console.log('user', user);
    return ctx.reply(
      'Welcome to the Crypto Bot! Type /token to get your API token.',
    );
  }

  public async handleToken(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);

    // token is the second argument
    const token = (ctx.message as any).text.split(' ')[1];

    const isValid = await this.openAIService.validateToken(token);
    if (!isValid) return ctx.reply('Invalid token.');

    user.token = token;
    await this.userService.updateUser(user);

    return ctx.reply(`Your API token is saved.`);
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

  private waitForResponse({
    user,
    runId,
    processingMessage,
    ctx,
  }: {
    user: User;
    runId: string;
    processingMessage: Message.TextMessage;
    ctx: Context;
  }) {
    const intervalId = setInterval(async () => {
      const run = await this.openAIService.getRun({
        runId,
        threadId: user.threadId,
        token: user.token,
      });

      if (run.status === 'failed') {
        clearInterval(intervalId);
        await this.telegraf.telegram.deleteMessage(
          processingMessage.chat.id,
          processingMessage.message_id,
        );
        await ctx.reply('something went wrong.');
      }

      if (run.status === 'completed') {
        clearInterval(intervalId);

        const messages = await this.openAIService.getMessages({
          threadId: user.threadId,
          token: user.token,
        });

        await this.telegraf.telegram.deleteMessage(
          processingMessage.chat.id,
          processingMessage.message_id,
        );

        const response = messages[0]?.content?.[0]?.text?.value;
        if (response?.length) {
          await ctx.reply(response);
        } else {
          await ctx.reply('something went wrong.');
        }

        user.runId = null;
        await this.userService.updateUser(user);
      }
    }, 1000);
  }

  private async processMessage(user: User, ctx: Context) {
    const processingMessage = await ctx.reply('processing...');

    const runId = await this.openAIService.sendMessage({
      threadId: user.threadId,
      assistantId: user.assistantId,
      content: (ctx.message as any).text,
      token: user.token,
    });

    this.waitForResponse({
      user,
      runId,
      processingMessage,
      ctx,
    });
  }

  /**
   * Handle any telegram text message
   * @param ctx
   */
  public async handleMessage(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);

    if (!user.token) {
      return ctx.reply(
        'Please set your API token first by typing "/token <YOUR_OPENAI_TOKEN>"',
      );
    }

    await this.initializeAssistantAndThread(user, ctx);
    await this.processMessage(user, ctx);
  }

  /**
   * This method sets the webhook for the telegram bot
   * @private
   */
  private async launchWebhook(webhookUrl: string) {
    const { hostname, port, pathname } = new URL(webhookUrl);

    return this.telegraf.launch({
      webhook: {
        domain: hostname,
        port: Number(port),
        hookPath: pathname,
      },
    });
  }

  /**
   * This method starts the polling for the telegram bot
   * @private
   */
  private async launchPolling() {
    return this.telegraf.launch();
  }

  /**
   * This method launches the bot based on the configuration
   * If the TELEGRAM_WEBHOOK_URL is set, it will launch the bot using the webhook
   * Otherwise, it will launch the bot using polling
   */
  public async launch() {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

    if (webhookUrl) {
      return this.launchWebhook(webhookUrl);
    } else {
      return this.launchPolling();
    }
  }
}
