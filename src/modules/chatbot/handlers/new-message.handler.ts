import { Injectable } from '@nestjs/common';
import { Handler } from './handler.interface';
import { Context } from 'telegraf';
import { UserService } from '../../user';
import { LangchainService } from '../../langchain/langchain.service';
import { TelegramService } from '../../telegram';
import { messages } from '../../../resources/messages';
import { Message } from '@telegraf/types';

@Injectable()
export class NewMessageHandler implements Handler {
  constructor(
    private readonly userService: UserService,
    private readonly langchainService: LangchainService,
    private readonly telegramService: TelegramService,
  ) {}

  public async handle(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);
    if (!user.token) return ctx.reply('no token');

    const response = await this.langchainService.executeMessage(
      user.userId,
      user.token,
      (ctx.message as Message.TextMessage).text,
    );

    const messagesStream = response.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk.content);
        },
      }),
    );

    await this.telegramService.sendAsyncMessagesStream(
      ctx.from.id,
      messages.processing,
      messagesStream,
    );
  }
}
