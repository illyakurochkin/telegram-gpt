import axios, { AxiosInstance } from 'axios';

export class OpenAIClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: { 'OpenAI-Beta': 'assistants=v1' },
    });
  }

  async createThread({ token }: { token: string }): Promise<string> {
    const thread = await this.client.post(
      '/threads',
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return thread.data.id;
  }

  async getMessages({ threadId, token }: { threadId: string; token: string }) {
    const response = await this.client.get(`/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.data;
  }

  async createMessage({
    threadId,
    content,
    token,
  }: {
    threadId: string;
    content: string;
    token: string;
  }): Promise<string> {
    try {
      const message = await this.client.post(
        `/threads/${threadId}/messages`,
        { content, role: 'user' },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return message.data.id;
    } catch (e) {
      console.log('e', e.response);
      throw e;
    }
  }

  async deleteThread({
    threadId,
    token,
  }: {
    threadId: string;
    token: string;
  }): Promise<void> {
    await this.client.delete(`/threads/${threadId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async createAssistant({ token }: { token: string }): Promise<string> {
    try {
      const assistant = await this.client.post(
        '/assistants',
        {
          model: 'gpt-3.5-turbo',
          instructions:
            'you are a clown. you always respond with a massive amount of emojis, memes and jokes',
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return assistant.data.id;
    } catch (e) {
      console.log('e', e);
      return '';
    }
  }

  async deleteAssistant({
    token,
    assistantId,
  }: {
    token: string;
    assistantId: string;
  }): Promise<void> {
    await this.client.delete(`/assistants/${assistantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async createRun({
    assistantId,
    threadId,
    token,
  }: {
    assistantId: string;
    threadId: string;
    token: string;
  }): Promise<string> {
    try {
      const run = await this.client.post(
        `/threads/${threadId}/runs`,
        { assistant_id: assistantId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return run.data.id;
    } catch (e) {
      console.log('e', e.response);
    }
  }

  async getRun({
    threadId,
    runId,
    token,
  }: {
    threadId: string;
    runId: string;
    token: string;
  }): Promise<{
    status:
      | 'queued'
      | 'in_progress'
      | 'requires_action'
      | 'cancelling'
      | 'cancelled'
      | 'failed'
      | 'completed'
      | 'expired';
  }> {
    try {
      const response = await this.client.get(
        `/threads/${threadId}/runs/${runId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.data || response.status !== 200)
        return { status: 'failed' };

      if (response.data.status === 'completed') return { status: 'completed' };

      if (['queued', 'in_progress'].includes(response.data.status))
        return { status: 'in_progress' };

      return { status: 'failed' };
    } catch {
      return { status: 'failed' };
    }
  }

  async validateToken({ token }: { token: string }): Promise<boolean> {
    try {
      const client = await this.client.get('/models', {
        headers: { Authorization: `Bearer ${token}` },
      });

      try {
        return client.status === 200;
      } catch {
        return false;
      }
    } catch (e) {
      console.log('e', e);
      return false;
    }
  }
}
