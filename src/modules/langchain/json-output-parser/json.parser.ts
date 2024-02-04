import { Json } from './json.types';

export const JSON_REGEX =
  /[-+]?\d*\.?\d+([eE][-+]?\d+)?|"(?:\\.|[^"\\])*"|\{(?:\s*"(?:\\.|[^"\\])*"\s*:\s*(?:\{[^{}]*\}|\[[^\[\]]*\]|[-+]?\d*\.?\d+([eE][-+]?\d+)?|"(?:\\.|[^"\\])*")\s*,?\s*)*\}|\[[^\[\]]*\]/gm;

const parseJson = (text: string): Json | null => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const parseJsonsSync = (text: string): Json[] =>
  (text.match(JSON_REGEX) || [])
    .map(parseJson)
    .filter((json): json is Json => json !== null);

export const parseJsons = (text: string): Promise<Json[]> => {
  let resolve: ((result: Json[]) => unknown) | null = null;

  const promise = new Promise<Json[]>((res) => {
    resolve = res;
  });

  setTimeout(() => resolve?.(parseJsonsSync(text)));
  return promise;
};
