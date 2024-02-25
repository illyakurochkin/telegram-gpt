import { Injectable, Logger } from "@nestjs/common";
import { Context, Telegraf } from "telegraf";
import type { Update } from "@telegraf/types";
import { URL } from "url";
import { sanitizeMarkdown } from "telegram-markdown-sanitizer";
import { sleep } from "./telegram.utils";

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
    this.telegraf.on("message", handler);
    this.logger.log(`registered message handler`);
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
        parse_mode: "MarkdownV2",
      });
    } catch {
      this.logger.error("couldn't parse markdown, sending as text", {
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
   * @param postfix - The text to append to the message (should be valid markdown)
   */
  public async editMarkdownMessage({
    chatId,
    messageId,
    text,
    postfix = "",
  }: {
    chatId: number;
    messageId: number;
    text: string;
    postfix?: string;
  }) {
    const parsed = sanitizeMarkdown(text) + postfix;

    try {
      return this.telegraf.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        parsed,
        {
          parse_mode: "MarkdownV2",
        },
      );
    } catch {
      this.logger.error("couldn't parse markdown, sending as text", {
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
    this.logger.log("sending async message", { chatId, loadingText });
    await this.telegraf.telegram.sendChatAction(chatId, "typing");

    const text = await promise;
    this.logger.log("sending async message result", { chatId, text });
    await this.sendMarkdownMessage(chatId, text);
  }

  // TODO: check if this method is used
  public async sendAsyncVoiceMessage(chatId: number, promise: Promise<string>) {
    await this.telegraf.telegram.sendChatAction(chatId, "record_voice");

    const file = await promise;
    await this.telegraf.telegram.sendVoice(chatId, file);
  }

  public async startTyping(chatId: number) {
    this.logger.log("start typing for chatId", chatId);
    await this.telegraf.telegram.sendChatAction(chatId, "typing");
  }

  public async startVoiceRecording(chatId: number) {
    this.logger.log("start voice recording for chatId", chatId);
    await this.telegraf.telegram.sendChatAction(chatId, "record_voice");
  }

  public async startChoosingSticker(chatId: number) {
    this.logger.log("start choosing sticker for chatId", chatId);
    await this.telegraf.telegram.sendChatAction(chatId, "choose_sticker");
  }

  public async sendAsyncMessagesStream(
    chatId: number,
    messagesStream: ReadableStream<string>,
  ) {
    this.logger.log("sending async messages stream...", { chatId });

    const reader = messagesStream.getReader();
    let result = await reader.read();

    await this.startTyping(chatId);

    let responseText = result.value;

    // skip empty messages
    while (!result.value && !result.done) {
      result = await reader.read();
      responseText = result.value;
    }

    this.logger.log("sending async messages stream initial message", {
      chatId,
      responseText,
    });

    const responseMessage = await this.telegraf.telegram.sendMessage(
      chatId,
      responseText,
    );

    let lastSentResponseText = responseText;

    // update telegram message with timeout
    setTimeout(async () => {
      while (true) {
        await sleep(1000);
        if (responseText && responseText !== lastSentResponseText) {
          await this.editMarkdownMessage({
            chatId,
            messageId: responseMessage.message_id,
            text: responseText,
            postfix: result.done ? "" : "\n|| ✨ ✨ ✨ ✨ ||",
          });
          lastSentResponseText = responseText;
          if (result.done) return;
        }
      }
    });

    // update responseText using the stream
    setTimeout(async () => {
      while (!result.done) {
        result = await reader.read();
        if (result.value) {
          responseText += result.value;
        }
      }
    });
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
    this.logger.log("handling update...", { update });
    await this.telegraf.handleUpdate(update);
    this.logger.log("update handled");
  }

  /**
   * This method sets the webhook for the telegram bot
   * @param webhookUrl - The url to set the webhook to
   */
  public async launchWebhook(webhookUrl: string): Promise<void> {
    this.logger.log("launching webhook...", { webhookUrl });
    const { hostname, port, pathname } = new URL(webhookUrl);

    await this.telegraf.launch({
      webhook: {
        domain: hostname,
        port: Number(port),
        hookPath: pathname,
        secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
      },
    });
    this.logger.log("webhook launched");
  }

  /**
   * This method starts the polling for the telegram bot
   */
  public async launchPolling(): Promise<void> {
    this.logger.log("launching polling...");
    await this.telegraf.launch();
    this.logger.log("polling launched");
  }
}
