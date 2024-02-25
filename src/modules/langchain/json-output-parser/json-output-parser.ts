import { BaseLLMOutputParser } from "@langchain/core/output_parsers";
import type { Json } from "./json.types";
import { ZodSchema, type SafeParseSuccess } from "zod";
import { parseJsons } from "./json.parser";

const DEFAULT_CHUNK_SIZE = 10;

export class JsonOutputParser<T extends Json> extends BaseLLMOutputParser<T[]> {
  static lc_name() {
    return "JsonOutputParser";
  }

  lc_namespace = ["langchain", "JsonOutputParser"];

  constructor(
    private readonly schema: ZodSchema<T>,
    private readonly chunkSize = DEFAULT_CHUNK_SIZE,
  ) {
    super();
  }

  async parseResult(generations: any[]): Promise<T[]> {
    const result: T[] = [];

    for (let i = 0; i < generations.length; i += this.chunkSize) {
      const inputBatch = generations.slice(i, i + this.chunkSize);
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
