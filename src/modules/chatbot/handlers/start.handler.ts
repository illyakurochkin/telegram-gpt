import { Injectable, Logger } from "@nestjs/common";
import { Context } from "telegraf";
import { UserService } from "../../user";
import { messages } from "../../../resources/messages";
import { BaseHandler } from "./base.handler";

@Injectable()
export class StartHandler extends BaseHandler {
  private readonly logger = new Logger(StartHandler.name);

  constructor(private readonly userService: UserService) {
    super();
  }

  // mark this function with decorator that says it's implementation of the interface
  protected async handle(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);
    this.logger.log(`user ${user.id} (${user.userId}) started the bot`);
    return ctx.replyWithHTML(messages.greeting);
  }
}
