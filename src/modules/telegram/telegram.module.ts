import { Module } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { TelegramService } from './telegram.service';

@Module({
  providers: [
    {
      provide: Telegraf,
      useFactory: () => new Telegraf(process.env.TELEGRAM_BOT_TOKEN),
    },
    TelegramService,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
