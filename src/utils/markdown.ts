const MULTILINE_CODE_REGEX = '(?<=\\n|^)```.*\\n?((?:.|\\n)*?)(?:\\n```|$)';
const SINGLE_LINE_CODE_REGEX = '(`.*?`)';
const SPECIAL_SYMBOL = '([_*\\[\\]()~`>#+\\-=|{}.!])';

export const toMarkdown = (input: string): string => {
  const regex = new RegExp(
    `${MULTILINE_CODE_REGEX}|${SINGLE_LINE_CODE_REGEX}|${SPECIAL_SYMBOL}`,
    'g',
  );

  return input.replace(
    regex,
    (match, g1_multilineCodeContent, g2_singleLineCode, g3_specialSymbol) => {
      if (g1_multilineCodeContent) {
        return match.replace(
          g1_multilineCodeContent,
          g1_multilineCodeContent.replace(/`/g, '\\`'),
        );
      } else if (g2_singleLineCode) {
        return g2_singleLineCode;
      } else if (g3_specialSymbol) {
        return `\\${g3_specialSymbol}`;
      }
      return match;
    },
  );
};
