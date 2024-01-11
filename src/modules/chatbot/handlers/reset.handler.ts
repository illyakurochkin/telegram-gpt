import { Injectable, Logger } from '@nestjs/common';
import { Handler } from './handler.interface';
import { Context } from 'telegraf';
import { UserService } from '../../user';
import { OpenAIService } from '../../openai';
import { messages } from '../../../resources/messages';
import { LangchainService } from '../../langchain/langchain.service';

@Injectable()
export class ResetHandler implements Handler {
  private readonly logger = new Logger(ResetHandler.name);

  constructor(
    private readonly userService: UserService,
    private readonly openAIService: OpenAIService,
    private readonly langchainService: LangchainService,
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
    await this.langchainService.clearMessages(user.userId);
    return ctx.replyWithHTML(messages.userReset);
  }
}
