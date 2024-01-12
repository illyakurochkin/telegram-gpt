import { Injectable } from '@nestjs/common';
import { Handler } from './handler.interface';
import { Context } from 'telegraf';
import { UserService } from '../../user';
import { LangchainService } from '../../langchain/langchain.service';
import { TelegramService } from '../../telegram';
import { Message } from '@telegraf/types';
import { messages } from '../../../resources/messages';

@Injectable()
export class NewMessageHandler implements Handler {
  constructor(
    private readonly userService: UserService,
    private readonly langchainService: LangchainService,
    private readonly telegramService: TelegramService,
  ) {}

  public async handle(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);
    if (!user.token) return ctx.replyWithHTML(messages.greeting);

    const messagesStream = await this.langchainService.executeMessage({
      userId: user.userId,
      token: user.token,
      message: (ctx.message as Message.TextMessage).text,
    });

    await this.telegramService.sendAsyncMessagesStream(
      ctx.from.id,
      messagesStream,
    );
  }
}
