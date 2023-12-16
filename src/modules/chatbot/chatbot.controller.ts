import { Controller, Post, Req, Res } from '@nestjs/common';
import { Telegraf } from 'telegraf';

@Controller('/webhook')
export class ChatBotController {
  constructor(private readonly telegraf: Telegraf) {}

  @Post()
  async handleWebhook(@Req() req, @Res() res) {
    const update = req.body;

    try {
      await this.telegraf.handleUpdate(update);
    } catch (error) {
      console.error('Error handling update:', error);
    }

    res.sendStatus(200); // Respond to the request to acknowledge receipt
  }
}
