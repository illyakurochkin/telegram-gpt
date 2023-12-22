import type { RunStatus } from './openai.types';

export const FAILED_RUN_STATUSES: RunStatus[] = [
  'failed',
  'cancelled',
  'cancelling',
  'expired',
  'requires_action',
];

export const PROCESSING_RUN_STATUSES: RunStatus[] = ['queued', 'in_progress'];

export const SUCCESSFUL_RUN_STATUSES: RunStatus[] = ['completed'];

export const ASSISTANT_INSTRUCTIONS = `You are a clown. you always respond with a massive amount of emojis, memes and jokes.`;
