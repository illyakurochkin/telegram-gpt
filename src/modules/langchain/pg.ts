import { Pool } from 'pg';
import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import {
  BaseMessage,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
} from '@langchain/core/messages';

export class PGChatMessageHistory extends BaseListChatMessageHistory {
  lc_namespace: string[] = ['langchain', 'stores', 'message', 'pg'];

  protected constructor(
    private readonly pool: Pool,
    private readonly tableName: string,
    private readonly sessionId: string,
    private readonly messagesLimit?: number,
  ) {
    super();
  }

  static async create({
    pool,
    tableName,
    sessionId,
    messagesLimit,
  }: {
    pool: Pool;
    tableName: string;
    sessionId: string;
    messagesLimit: number;
  }): Promise<PGChatMessageHistory> {
    await pool.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (
      id SERIAL PRIMARY KEY,
      content TEXT NULL,
      message_type TEXT NULL,
      session_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`);

    return new PGChatMessageHistory(pool, tableName, sessionId, messagesLimit);
  }

  async getMessages(): Promise<BaseMessage[]> {
    const result = await this.pool.query(
      `SELECT * FROM "${
        this.tableName
      }" WHERE session_id = $1 ORDER BY created_at DESC ${
        this.messagesLimit ? `LIMIT ${this.messagesLimit}` : ''
      }`,
      [this.sessionId],
    );

    return mapStoredMessagesToChatMessages(
      result.rows
        .sort((left, right) => left.created_at - right.created_at)
        .map((row) => ({
          type: row.message_type,
          data: {
            content: row.content,
            role: undefined,
            name: undefined,
            id: row.id.toString(),
            tool_call_id: undefined,
          },
        })),
    );
  }

  async clearMessages(): Promise<void> {
    await this.pool.query(
      `DELETE FROM "${this.tableName}" WHERE session_id = $1`,
      [this.sessionId],
    );
  }

  async addMessage(message: BaseMessage): Promise<void> {
    const [storedMessage] = mapChatMessagesToStoredMessages([message]);

    const query = `INSERT INTO "${this.tableName}" (content, message_type, session_id) VALUES ($1, $2, $3)`;

    await this.pool.query(query, [
      storedMessage.data.content,
      message._getType(),
      this.sessionId,
    ]);
  }

  async getMessagesByIds(ids: string[]): Promise<BaseMessage[]> {
    if (!ids.length) return [];
    const result = await this.pool.query(
      `SELECT * FROM "${this.tableName}" WHERE id IN (${ids.join(
        ',',
      )}) ORDER BY created_at DESC ${
        this.messagesLimit ? `LIMIT ${this.messagesLimit}` : ''
      }`,
      [],
    );

    return mapStoredMessagesToChatMessages(
      result.rows
        .sort((left, right) => left.created_at - right.created_at)
        .map((row) => ({
          type: row.message_type,
          data: {
            content: row.content,
            role: undefined,
            name: undefined,
            tool_call_id: undefined,
          },
        })),
    );
  }
}
