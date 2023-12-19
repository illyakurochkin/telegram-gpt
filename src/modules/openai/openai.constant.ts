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
