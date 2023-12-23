import { Injectable, Logger } from '@nestjs/common';
import { Handler } from './handler.interface';
import { Context } from 'telegraf';
import { UserService } from '../../user';
import { MessageHandler } from './message.handler';
import { Message } from '@telegraf/types';
import { TelegramService } from '../../telegram';

@Injectable()
export class AdminHandler implements Handler {
  private readonly logger = new Logger(AdminHandler.name);

  constructor(
    private readonly userService: UserService,
    private readonly telegramService: TelegramService,
    private readonly messageHandler: MessageHandler,
  ) {}

  public async handle(ctx: Context) {
    const telegramUserId = ctx.from.id;

    // check if user is admin
    const isAdmin = telegramUserId.toString() === process.env.TELEGRAM_ADMIN_ID;
    if (!isAdmin) return this.messageHandler.handle(ctx);

    const message = (ctx.message as Message.TextMessage).text;

    // command is the second word of the first line
    const command = message.split('\n')[0].split(' ')[1];
    if (command === 'notify-everyone') return this.handleNotifyEveryone(ctx);

    return this.messageHandler.handle(ctx);
  }

  private async handleNotifyEveryone(ctx: Context) {
    const message = (ctx.message as Message.TextMessage).text;

    const notificationText = message.split('\n').slice(1).join('\n');
    this.logger.log(`sending notification to everyone: ${notificationText}`);

    const users = await this.userService.findAllUsers();

    for (const user of users) {
      this.logger.log(`sending notification to user ${user.id}`);
      await this.telegramService.sendMessage(user.userId, notificationText);
    }

    this.logger.log(`notification sent to ${users.length} users`);
  }
}
