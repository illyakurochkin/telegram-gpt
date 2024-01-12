import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { Pool } from 'pg';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { HumanMessage, MessageContent } from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { PGChatMessageHistory } from './pg';
import { ASSISTANT_INSTRUCTIONS } from '../openai/openai.constant';

@Injectable()
export class LangchainService {
  public async clearMessages(userId: number) {
    const messageHistory = await PGChatMessageHistory.create({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
      messagesLimit: 5,
      tableName: 'pg_chat_message_history15',
      sessionId: userId.toString(),
    });

    await messageHistory.clearMessages();
  }

  private async filterMessages(model, messages: any[]) {
    const messagesWithNumTokens = await Promise.all(
      messages.map(async (message) => ({
        message,
        numTokens: await model.getNumTokens(JSON.stringify(message.toDict())),
      })),
    );

    return messagesWithNumTokens
      .reverse()
      .reduce(
        (accumulator, { message, numTokens }, index) => {
          const useNumTokens = accumulator.reduce(
            (sum, { numTokens: nk }) => sum + nk,
            0,
          );

          if (
            index === messagesWithNumTokens.length - 1 ||
            useNumTokens + numTokens < model.maxTokens
          ) {
            accumulator.push({ message, numTokens });
          }

          return accumulator;
        },
        [] as typeof messagesWithNumTokens,
      )
      .map(({ message }) => message)
      .reverse();
  }

  private createMetaPrefix(userId: number) {
    return `[date="${new Date().toISOString()}", user="${userId}"]\n\n`;
  }

  public async executeMessage({
    userId,
    token,
    message,
  }: {
    userId: number;
    token: string;
    message: string;
  }): Promise<ReadableStream<string>> {
    const model = new ChatOpenAI({
      openAIApiKey: token,
      streaming: true,
      maxTokens: 1000,
      verbose: true,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      new HumanMessage(ASSISTANT_INSTRUCTIONS),
      new MessagesPlaceholder('history'),
      new HumanMessage(message),
    ]);

    const messageHistory = await PGChatMessageHistory.create({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
      messagesLimit: 100,
      tableName: 'pg_chat_message_history15',
      sessionId: userId.toString(),
    });

    const runnable = prompt
      .pipe(({ messages }) => this.filterMessages(model, messages))
      .pipe(model);

    const withHistory = new RunnableWithMessageHistory({
      runnable,
      getMessageHistory: () => messageHistory,
      inputMessagesKey: 'input',
      historyMessagesKey: 'history',
    });

    const stream = await withHistory.stream(
      { input: `${this.createMetaPrefix(userId)}\n${message}` },
      { configurable: { sessionId: '1' } },
    );

    return stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk.content as string);
        },
      }),
    );
  }
}
