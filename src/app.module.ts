import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChatBotModule,
  OpenAIModule,
  TelegramModule,
  UserModule,
} from './modules';
import { databaseConfig } from './config/typeorm';
import { TelegramService } from './modules/telegram';

@Module({
  imports: [
    ChatBotModule,
    OpenAIModule,
    UserModule,
    TelegramModule,
    TypeOrmModule.forRoot(databaseConfig),
  ],
})
export class AppModule {}
