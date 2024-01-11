import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { Pool } from 'pg';
import {
  RunnableConfig,
  RunnableWithMessageHistory,
} from '@langchain/core/runnables';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
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

  public async executeMessage(userId: number, token: string, message: string) {
    const model = new ChatOpenAI({
      openAIApiKey: token,
      streaming: true,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      new AIMessage(ASSISTANT_INSTRUCTIONS),
      new MessagesPlaceholder('history'),
      new HumanMessage(message),
    ]);

    const messageHistory = await PGChatMessageHistory.create({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
      messagesLimit: 5,
      tableName: 'pg_chat_message_history15',
      sessionId: userId.toString(),
    });

    const runnable = prompt.pipe(model);
    const withHistory = new RunnableWithMessageHistory({
      runnable,
      getMessageHistory: () => messageHistory,
      inputMessagesKey: 'input',
      historyMessagesKey: 'history',
    });

    const config: RunnableConfig = { configurable: { sessionId: '1' } };

    return withHistory.stream(
      {
        input: `[date="${new Date().toISOString()}", user="${userId}"]\r\n${message}`,
      },
      config,
    );
  }
}
