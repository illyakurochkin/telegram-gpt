import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { Handler } from './handler.interface';
import { UserService } from '../../user';
import { messages } from '../../../resources/messages';
import { TelegramService } from '../../telegram';

@Injectable()
export class StartHandler implements Handler {
  private readonly logger = new Logger(StartHandler.name);

  constructor(
    private readonly userService: UserService,
    private readonly telegramService: TelegramService,
  ) {}

  // mark this function with decorator that says it's implementation of the interface
  public async handle(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);
    this.logger.log(`user ${user.id} (${user.userId}) started the bot`);
    return ctx.replyWithHTML(messages.greeting);
  }
}
