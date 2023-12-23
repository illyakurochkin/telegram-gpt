import { Injectable, Logger } from '@nestjs/common';
import { Handler } from './handler.interface';
import { Context } from 'telegraf';
import { UserService } from '../../user';
import { OpenAIService } from '../../openai';
import { messages } from '../../../resources/messages';

@Injectable()
export class ResetHandler implements Handler {
  private readonly logger = new Logger(ResetHandler.name);

  constructor(
    private readonly userService: UserService,
    private readonly openAIService: OpenAIService,
  ) {}

  public async handle(ctx: Context) {
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
}
