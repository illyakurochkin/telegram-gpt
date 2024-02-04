import { Injectable, Logger } from '@nestjs/common';
import { OpenAIClient } from './openai-client';
import * as path from 'path';
import OpenAI from 'openai';
import * as fs from 'fs';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openAIClient: OpenAIClient = new OpenAIClient();

  async textToSpeech({ token, text }: { token: string; text: string }) {
    const speechFile = path.resolve(`./speech-${new Date().getTime()}.mp3`);
    const openai = new OpenAI({ apiKey: token });
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);
    return speechFile;
  }

  async speechToText({ token, speech }: { token: string; speech: File }) {
    const openai = new OpenAI({ apiKey: token });
    const result = await openai.audio.transcriptions.create({
      file: speech,
      model: 'whisper-1',
    });

    return result.text;
  }

  async createThread({ token }: { token: string }): Promise<string> {
    const threadId = await this.openAIClient.createThread({ token });
    this.logger.log(`created thread ${threadId}`);
    return threadId;
  }

  async getMessages({ threadId, token }: { threadId: string; token: string }) {
    const messages = await this.openAIClient.getMessages({ threadId, token });
    this.logger.log(`got ${messages.length} messages from thread ${threadId}`);
    return messages;
  }

  async deleteThread({
    threadId,
    token,
  }: {
    threadId: string;
    token: string;
  }): Promise<void> {
    await this.openAIClient.deleteThread({ threadId, token });
    this.logger.log(`deleted thread ${threadId}`);
  }

  async createAssistant({ token }: { token: string }): Promise<string> {
    const assistantId = await this.openAIClient.createAssistant({ token });
    this.logger.log(`created assistant ${assistantId}`);
    return assistantId;
  }

  async deleteAssistant({
    assistantId,
    token,
  }: {
    assistantId: string;
    token: string;
  }): Promise<void> {
    await this.openAIClient.deleteAssistant({ assistantId, token });
    this.logger.log(`deleted assistant ${assistantId}`);
  }

  async getRun({
    runId,
    threadId,
    token,
  }: {
    runId: string;
    threadId: string;
    token: string;
  }) {
    const run = await this.openAIClient.getRun({ runId, token, threadId });
    this.logger.log(`got run ${runId} with status ${run.status}`);
    return run;
  }

  async sendMessage({
    threadId,
    assistantId,
    content,
    token,
  }: {
    threadId: string;
    assistantId: string;
    content: string;
    token: string;
  }): Promise<string> {
    await this.openAIClient.createMessage({ threadId, content, token });
    this.logger.log(`sent message to thread ${threadId}`);
    const run = await this.openAIClient.createRun({
      assistantId,
      threadId,
      token,
    });
    this.logger.log(`created run ${run}`);
    return run;
  }

  /**
   * This method validates the token by calling the models.list() method
   * @param token
   */
  async validateToken(token: string): Promise<boolean> {
    const isValid = await this.openAIClient.validateToken({ token });
    this.logger.log(`token ${token} is ${isValid ? 'valid' : 'invalid'}`);
    return isValid;
  }
}
