import { Injectable } from '@nestjs/common';
import { Handler } from './handler.interface';
import { LangchainService } from '../../langchain/langchain.service';
import { TelegramService } from '../../telegram';
import { OpenAIService } from '../../openai';
import { UserService } from '../../user';
import { Context } from 'telegraf';
import { messages } from '../../../resources/messages';
import { Message } from '@telegraf/types';
import { streamToPromise } from '../../langchain/langchain.utils';
import * as fs from 'fs';
import VoiceMessage = Message.VoiceMessage;
import axios from 'axios';

@Injectable()
export class SpeechToTextHandler implements Handler {
  constructor(
    private readonly langchainService: LangchainService,
    private readonly telegramService: TelegramService,
    private readonly openAIService: OpenAIService,
    private readonly userService: UserService,
  ) {}

  public async handle(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);
    if (!user.token) return ctx.replyWithHTML(messages.greeting);

    await this.telegramService.startChoosingSticker(ctx.chat.id);

    const voiceMessage = ctx.message as VoiceMessage;

    const fileLink = await ctx.telegram.getFileLink(voiceMessage.voice.file_id);

    const fileResponse = await axios.get(fileLink.href, {
      responseType: 'arraybuffer',
    });

    const file = new File([fileResponse.data], 'speech.oga');
    const message = await this.openAIService.speechToText({
      token: user.token,
      speech: file,
    });

    await this.telegramService.startVoiceRecording(ctx.chat.id);

    const messagesStream = await this.langchainService.executeMessage({
      userId: user.userId,
      token: user.token,
      message: message,
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
