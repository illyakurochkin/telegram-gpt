import { Injectable, Logger } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { Update } from '@telegraf/types';
import { URL } from 'url';
import { sanitizeMarkdown } from 'telegram-markdown-sanitizer';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly telegraf: Telegraf<Context>) {}

  /**
   * This method registers a command handler
   * @param command - The command to register
   * @param handler - The handler to register
   */
  public registerCommand(command: string, handler: (ctx: Context) => any) {
    this.telegraf.command(command, handler);
    this.logger.log(`Registered command /${command}`);
  }

  /**
   * This method registers a message handler
   * @param handler - The handler to register
   */
  public registerMessageHandler(handler: (ctx: Context) => any) {
    this.telegraf.on('message', handler);
    this.logger.log(`Registered message handler`);
  }

  /**
   * This method handles the start command
   */
  public async sendMessage(chatId: number, text: string) {
    return this.telegraf.telegram.sendMessage(chatId, text);
  }

  /**
   * This method handles the start command
   * Try to parse the text as markdown, if it fails, send as text
   * @param chatId - The chat to send the message to
   * @param text - The text to send (not parsed)
   */
  public async sendMarkdownMessage(chatId: number, text: string) {
    const parsed = sanitizeMarkdown(text);

    try {
      return this.telegraf.telegram.sendMessage(chatId, parsed, {
        parse_mode: 'MarkdownV2',
      });
    } catch {
      this.logger.error("Couldn't parse markdown, sending as text", {
        text,
        parsed,
      });
      return this.telegraf.telegram.sendMessage(chatId, text);
    }
  }

  /**
   * This method handles the start command
   * Try to parse the text as markdown, if it fails, send as text
   * @param chatId - The chat to send the message to
   * @param messageId - The message to edit
   * @param text - The text to send (not parsed)
   */
  public async editMarkdownMessage(
    chatId: number,
    messageId: number,
    text: string,
  ) {
    const parsed = sanitizeMarkdown(text);

    try {
      return this.telegraf.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        parsed,
        {
          parse_mode: 'MarkdownV2',
        },
      );
    } catch {
      this.logger.error("Couldn't parse markdown, sending as text", {
        text,
        parsed,
      });
      return this.telegraf.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        text,
      );
    }
  }

  /**
   * This method sends async messages
   * It sends a loading message first, then edits it with the result of the promise
   * @param chatId - The chat to send the message to
   * @param loadingText - The text to send while loading
   * @param promise - The promise to await
   */
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
    await this.editMarkdownMessage(chatId, loadingMessage.message_id, text);
  }

  /**
   * This method handles the start command
   * @param chatId - The chat to delete the message from
   * @param messageId - The message to delete
   */
  public async deleteMessage(chatId: number, messageId: number) {
    return this.telegraf.telegram.deleteMessage(chatId, messageId);
  }

  /**
   * This method handles telegram updates (new messages, etc)
   * It's only used for the webhook
   * @param update
   */
  public async handleUpdate(update: Update) {
    return this.telegraf.handleUpdate(update);
  }

  /**
   * This method sets the webhook for the telegram bot
   * @param webhookUrl - The url to set the webhook to
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
