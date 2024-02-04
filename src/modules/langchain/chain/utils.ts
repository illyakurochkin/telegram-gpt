import { ChatOpenAI, OpenAI } from '@langchain/openai';
import { BaseMessage } from '@langchain/core/messages';

export const filterMessages = async (
  model: OpenAI | ChatOpenAI,
  messages: BaseMessage[],
  maxTokens: number,
) => {
  const messagesWithNumTokens = await Promise.all(
    messages.map(async (message) => ({
      message,
      numTokens: await model.getNumTokens(JSON.stringify(message)),
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
          useNumTokens + numTokens < maxTokens
        ) {
          accumulator.push({ message, numTokens });
        }

        return accumulator;
      },
      [] as typeof messagesWithNumTokens,
    )
    .map(({ message }) => message)
    .reverse();
};
