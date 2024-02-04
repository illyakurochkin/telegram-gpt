import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { JsonOutputParser } from '../json-output-parser';
import { z } from 'zod';
import { filterMessages } from './utils';
import { OpenAI } from '@langchain/openai';
import { BaseMessage } from '@langchain/core/messages';

export const getRephraseChain = (token: string, messages: BaseMessage[]) => {
  const model = new OpenAI({
    modelName: 'gpt-3.5-turbo',
    openAIApiKey: token,
    streaming: true,
    maxTokens: 3000,
    verbose: false,
  });

  const messageHistoryPrompt = PromptTemplate.fromTemplate(`
Below is the conversation between human and AI.
Based on it generate rephrased versions of the last message from the human that are extended to include all key context from the conversation.
It should include all the context needed to understand it without seeing the entire conversation.
DO NOT MISS ANY BIT OF THE CONTEXT, everything should be present in the rephrased messages.
List top 3 rephrased options using the following JSON format. Respond with valid JSON list of strings only.
ALWAYS RESPOND WITH THE REPHRASED VERSION OF A MESSAGE - VALID JSON ONLY. Response format:
\`\`\`
["<rephrased1>", "<rephrased2>", "<rephrased3>"]
\`\`\`

--- example 1 start ---
CONVERSATION:
human: my birthday is on the 5th of May
ai: great, that is awesome
human: when is the best time to start preparing?

OUTPUT: 
["when is the best time to start preparing for my birthday on the 5th of May?"]
--- example 1 end ---


--- example 2 start ---
CONVERSATION:
human: propose a name for a new company
ai: Innovative Solutions
human: improve

OUTPUT: 
["improve the generated company name 'Innovative Solutions'"]
--- example 2 end ---

   
--- conversation start ---
{messages}

human: {input}
--- conversation end ---


OUTPUT:
  `);

  let initialInput = '';

  return RunnableSequence.from([
    {
      input: ({ input }) => {
        initialInput = input;
        return input;
      },
      messages: async () => {
        const latestMessages = await filterMessages(model, messages, 500);

        return latestMessages
          .map((message) => `${message._getType()}: ${message.content}`)
          .join('\n\n');
      },
    },
    messageHistoryPrompt,
    model,
    new JsonOutputParser(z.array(z.string())),
    (input) => input.flat()[0] ?? initialInput,
  ]);
};
