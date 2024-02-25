import { BaseMessage } from "@langchain/core/messages";
import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "langchain/document_loaders/base";

export class ChatHistorySplitter extends BaseDocumentLoader {
  constructor(
    private readonly userId: number,
    private readonly messages: BaseMessage[],
  ) {
    super();
  }

  async load(): Promise<Document[]> {
    // this.chatHistory.
    // throw new Error('Method not implemented.');

    // return messages grouped
    // for example if i had numbers 1,2,3,4,5,6,7,8,9,10
    // the resuld would be [1,2,3], [2,3,4], [3,4,5], [4,5,6], [5,6,7], [6,7,8], [7,8,9], [8,9,10]
    // const messagesIds = messages.map((message) => message.id);
    const messagesGroups = this.messages
      .sort((left, right) => left.lc_kwargs.id - right.lc_kwargs.id)
      .reduce(
        (accumulator, message, index) => {
          if (index === this.messages.length - 1) {
            return accumulator;
          }

          accumulator.push([message, this.messages[index + 1]]);

          return accumulator;
        },
        [] as [BaseMessage, BaseMessage][],
      );

    return messagesGroups.map((messagesGroups) => {
      return new Document({
        pageContent: messagesGroups
          .map((message) => message.content)
          .join("\n\n"),
        metadata: {
          userId: this.userId,
          messagesIds: messagesGroups.map((message) => message.lc_kwargs.id),
        },
      });
    });
  }
}
