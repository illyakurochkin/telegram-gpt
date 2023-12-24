import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { TelegramService } from '../telegram';
import { LoggerService } from '../logger/logger.service';

@Controller('/webhook')
export class ChatBotController {
  private readonly logger = new LoggerService(ChatBotController.name);

  constructor(
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,
  ) {}

  @Post()
  async handleWebhook(@Req() req, @Res() res) {
    const update = req.body;

    try {
      await this.telegramService.handleUpdate(update);
    } catch (error) {
      this.logger.error('Error handling update:', error);
    }

    res.sendStatus(200);
  }

  @Get()
  async test() {
    return `hello-${(Math.random() * 1000).toFixed()}`;
  }
}
