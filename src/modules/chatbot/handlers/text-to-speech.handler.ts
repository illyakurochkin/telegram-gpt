import { Handler } from './handler.interface';
import { LangchainService } from '../../langchain/langchain.service';
import { Context } from 'telegraf';
import { Message } from '@telegraf/types';
import { TelegramService } from '../../telegram';
import { messages } from '../../../resources/messages';
import { UserService } from '../../user';
import { streamToPromise } from '../../langchain/langchain.utils';
import { Injectable } from '@nestjs/common';
import { OpenAIService } from '../../openai';
import * as fs from 'fs';

@Injectable()
export class TextToSpeechHandler implements Handler {
  constructor(
    private readonly langchainService: LangchainService,
    private readonly telegramService: TelegramService,
    private readonly openAIService: OpenAIService,
    private readonly userService: UserService,
  ) {}

  public async handle(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);
    if (!user.token) return ctx.replyWithHTML(messages.greeting);

    await this.telegramService.startVoiceRecording(ctx.chat.id);

    const messagesStream = await this.langchainService.executeMessage({
      userId: user.userId,
      token: user.token,
      message: (ctx.message as Message.TextMessage).text,
    });

    const responseMessage = await streamToPromise(messagesStream);

    const speechFile = await this.openAIService.textToSpeech({
      token: user.token,
      text: responseMessage,
    });

    try {
      await ctx.replyWithVoice({ source: speechFile });
    } finally {
      fs.unlinkSync(speechFile);
    }
  }
}
