import { Injectable } from '@nestjs/common';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Pool } from 'pg';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { filterMessages } from './chain/utils';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  BaseChatPromptTemplate,
} from '@langchain/core/prompts';
import { PGChatMessageHistory } from './pg';
import { ASSISTANT_INSTRUCTIONS } from '../openai/openai.constant';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { RunnableSequence } from '@langchain/core/runnables';
import { getRephraseChain } from './chain/rephrase.chain';
import { ChatHistorySplitter } from './chat-history-splitter';
import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class LangchainService {
  public async clearMessages(userId: number) {
    const messageHistory = await this.getMessagesHistory(userId);
    await messageHistory.clearMessages();
  }

  private getLlmModel(token: string): ChatOpenAI {
    return new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      openAIApiKey: token,
      streaming: true,
      maxTokens: 3000,
      verbose: false,
    });
  }

  private getEmbeddingsModel(token: string): OpenAIEmbeddings {
    return new OpenAIEmbeddings({ openAIApiKey: token });
  }

  private getMessagesHistoryPromptTemplate(): BaseChatPromptTemplate<
    { history: string; input: string },
    'history'
  > {
    return ChatPromptTemplate.fromMessages([
      ['system', ASSISTANT_INSTRUCTIONS],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);
  }

  private getMessagesHistory(userId: number): Promise<PGChatMessageHistory> {
    return PGChatMessageHistory.create({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
      messagesLimit: 1000,
      tableName: 'pg_chat_message_history15',
      sessionId: userId.toString(),
    });
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
    const llmModel = this.getLlmModel(token);
    const messageHistoryPrompt = this.getMessagesHistoryPromptTemplate();
    const messageHistory = await this.getMessagesHistory(userId);

    const allMessages = await messageHistory.getMessages();
    const documents = await new ChatHistorySplitter(userId, allMessages).load();

    const embeddingsModel = this.getEmbeddingsModel(token);

    // const store = await MemoryVectorStore.fromDocuments(
    //   documents,
    //   embeddingsModel,
    // );

    const store = await SupabaseVectorStore.fromExistingIndex(embeddingsModel, {
      client: new SupabaseClient(
        process.env.SUPABASE_PROJECT_URL,
        process.env.SUPABASE_API_KEY,
      ),
    });

    const runnableSequence = RunnableSequence.from([
      {
        input: ({ input }) => input,
        messages: ({ history }) => history,
        rephrased: getRephraseChain(token, allMessages),
      },
      {
        input: ({ input }) => input,
        history: async ({ messages, rephrased }) => {
          const latestMessages = await filterMessages(llmModel, messages, 1000);

          const similarDocuments = await store.similaritySearch(
            rephrased,
            undefined,
            { userId },
          );

          const similarMessagesIds = similarDocuments
            .map((document) => document.metadata.messagesIds as string)
            .filter(Boolean);

          const similarMessages = await filterMessages(
            llmModel,
            await messageHistory.getMessagesByIds(similarMessagesIds),
            500,
          );

          return [...similarMessages, ...latestMessages].sort(
            (left, right) => left.lc_kwargs.id - right.lc_kwargs.id,
          );
        },
      },
      messageHistoryPrompt,
      llmModel,
    ]);

    const runnableWithHistory = new RunnableWithMessageHistory({
      runnable: runnableSequence,
      getMessageHistory: () =>
        new (class extends BaseListChatMessageHistory {
          lc_namespace: string[] = ['langchain', 'stores', 'message', 'pg'];

          addMessage(message: BaseMessage): Promise<void> {
            return messageHistory.addMessage(message);
          }

          async getMessages(): Promise<BaseMessage[]> {
            return allMessages;
          }

          clearMessages(): Promise<void> {
            return messageHistory.clearMessages();
          }
        })(),
      inputMessagesKey: 'input',
      historyMessagesKey: 'history',
    });

    const [stream] = await Promise.all([
      runnableWithHistory.stream(
        { input: `[sent-date:${new Date().toISOString()}]\n${message}` },
        { configurable: { sessionId: '1' } },
      ),
      documents.length && store.addDocuments([documents[documents.length - 1]]),
    ]);

    return stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk.content as string);
        },
      }),
    );
  }
}
