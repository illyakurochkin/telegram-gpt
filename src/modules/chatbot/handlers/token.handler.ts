import { Injectable, Logger } from "@nestjs/common";
import { Context } from "telegraf";
import { OpenAIService } from "../../openai";
import { UserService } from "../../user";
import { Message } from "@telegraf/types";
import { messages } from "../../../resources/messages";
import { BaseHandler } from "./base.handler";

@Injectable()
export class TokenHandler extends BaseHandler {
  private readonly logger = new Logger(TokenHandler.name);

  constructor(
    private readonly userService: UserService,
    private readonly openAIService: OpenAIService,
  ) {
    super();
  }

  protected async handle(ctx: Context) {
    const user = await this.userService.findOrCreateUser(ctx.from.id);

    // token is the second argument
    const token = (ctx.message as Message.TextMessage).text?.split(" ")[1];
    if (!token) return ctx.replyWithHTML(messages.tokenRequired);

    const isValid = await this.openAIService.validateToken(token);
    if (!isValid) return ctx.replyWithHTML(messages.tokenRejected);

    await this.userService.setUserToken(user, token);
    return ctx.replyWithHTML(messages.tokenAccepted);
  }
}
