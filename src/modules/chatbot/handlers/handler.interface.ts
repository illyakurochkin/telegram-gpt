import { Context } from 'telegraf';

export interface Handler {
  handle(ctx: Context): Promise<any>;
}
