import { Injectable, Logger } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { URL } from 'url';
import { toMarkdown } from '../../utils/markdown';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly telegraf: Telegraf<Context>) {}

  /**
   * This method registers a command handler
   */
  public registerCommand(
    command: string,
    handler: (ctx: Context) => Promise<void>,
  ) {
    this.telegraf.command(command, handler);
    this.logger.log(`Registered command /${command}`);
  }

  /**
   * This method registers a message handler
   */
  public registerMessageHandler(handler: (ctx: Context) => Promise<void>) {
    this.telegraf.on('message', handler);
    this.logger.log(`Registered message handler`);
  }

  /**
   * This method handles the start command
   */
  public async sendMessage(chatId: number, text: string) {
    return this.telegraf.telegram.sendMessage(chatId, text);
  }

  public async sendAsyncMessage(
    chatId: number,
    loadingText: string,
    promise: Promise<string>,
  ) {
    const loadingMessage = await this.telegraf.telegram.sendMessage(
      chatId,
      loadingText,
    );

    const text = await promise;
    const parsed = toMarkdown(text);

    try {
      await this.telegraf.telegram.editMessageText(
        chatId,
        loadingMessage.message_id,
        undefined,
        parsed,
        {
          parse_mode: 'MarkdownV2',
        },
      );
    } catch {
      await this.telegraf.telegram.editMessageText(
        chatId,
        loadingMessage.message_id,
        undefined,
        text,
      );
    }
  }

  /**
   * This method handles the start command
   */
  public async deleteMessage(chatId: number, messageId: number) {
    return this.telegraf.telegram.deleteMessage(chatId, messageId);
  }

  /**
   * This method sets the webhook for the telegram bot
   */
  public async launchWebhook(webhookUrl: string) {
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
   */
  public async launchPolling() {
    return this.telegraf.launch();
  }
}
