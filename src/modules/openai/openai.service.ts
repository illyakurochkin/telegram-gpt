import { Injectable, Logger } from '@nestjs/common';
import { OpenAIClient } from './openai-client';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openAIClient: OpenAIClient = new OpenAIClient();

  async createThread({ token }: { token: string }): Promise<string> {
    return this.openAIClient.createThread({ token });
  }

  async getMessages({ threadId, token }: { threadId: string; token: string }) {
    return this.openAIClient.getMessages({ threadId, token });
  }

  async deleteThread({
    threadId,
    token,
  }: {
    threadId: string;
    token: string;
  }): Promise<void> {
    return this.openAIClient.deleteThread({ threadId, token });
  }

  async createAssistant({ token }: { token: string }): Promise<string> {
    return this.openAIClient.createAssistant({ token });
  }

  async deleteAssistant({
    assistantId,
    token,
  }: {
    assistantId: string;
    token: string;
  }): Promise<void> {
    return this.openAIClient.deleteAssistant({ assistantId, token });
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
    return this.openAIClient.getRun({ runId, token, threadId });
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
    console.log('content', content);
    try {
      await this.openAIClient.createMessage({ threadId, content, token });
      return this.openAIClient.createRun({
        assistantId,
        threadId,
        token,
      });
    } catch (e) {
      console.log('e.data', e.data);
    }
  }

  /**
   * This method validates the token by calling the models.list() method
   * @param apiKey
   */
  async validateToken(token: string): Promise<boolean> {
    return this.openAIClient.validateToken({ token });
  }
}
