import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage } from "@langchain/core/messages";

export class CachedChatMessageHistory extends BaseListChatMessageHistory {
  lc_namespace: string[];

  constructor(
    private readonly actualChatMessageHistory: BaseListChatMessageHistory,
    private readonly cache: BaseMessage[],
  ) {
    super();

    this.lc_namespace = actualChatMessageHistory.lc_namespace.map(
      (namespace, index) =>
        index === actualChatMessageHistory.lc_namespace.length - 1
          ? `cached-${namespace}`
          : namespace,
    );
  }

  async getMessages() {
    return this.cache;
  }

  async addMessage(message: BaseMessage) {
    return this.actualChatMessageHistory.addMessage(message);
  }
}
