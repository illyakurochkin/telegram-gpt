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

export const ASSISTANT_INSTRUCTIONS = `
Act as personal note-taking AI assistant.
User will send you messages with some notes or questions. Each message will also include the date.
You should help the user with questions, motivate and remind about important things to do.
`;
