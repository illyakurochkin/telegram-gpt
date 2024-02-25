import { Context } from "telegraf";
import { Logger } from "@nestjs/common";

export abstract class BaseHandler {
  private readonly baseLogger = new Logger(BaseHandler.name);

  protected abstract handle(ctx: Context): Promise<any>;

  public handleMessage(ctx: Context): Promise<any> {
    try {
      return this.handle(ctx);
    } catch (error) {
      this.baseLogger.error("Error handling message", error);
      return ctx.reply("Something went wrong. Please try again later.");
    }
  }
}
