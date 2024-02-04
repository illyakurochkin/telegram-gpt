import { BaseLLMOutputParser } from '@langchain/core/output_parsers';
import { Json } from './json.types';
import { SafeParseReturnType, ZodSchema } from 'zod';
import { parseJsons } from './json.parser';
import { SafeParseSuccess } from 'zod/lib/types';

export class JsonOutputParser<T extends Json> extends BaseLLMOutputParser<T[]> {
  static lc_name() {
    return 'JsonOutputParser';
  }

  lc_namespace = ['langchain', 'JsonOutputParser'];

  constructor(private readonly schema: ZodSchema<T>) {
    super();
  }

  async parseResult(generations: any[]): Promise<T[]> {
    const result: T[] = [];

    for (let i = 0; i < generations.length; i += 10) {
      const inputBatch = generations.slice(i, i + 10);
      const parsedValues = await Promise.all(
        inputBatch.map(({ text }) => parseJsons(text)),
      );

      const validatedResults = (
        await Promise.all(
          parsedValues.flat().map((json) => this.schema.safeParseAsync(json)),
        )
      )
        .filter(
          (parsingResult): parsingResult is SafeParseSuccess<T> =>
            parsingResult.success,
        )
        .map((parsingResult) => parsingResult.data);

      result.push(...validatedResults);
    }

    return result;
  }
}
