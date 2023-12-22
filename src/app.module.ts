import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatBotModule, OpenAIModule, UserModule } from './modules';
import { databaseConfig } from './config/typeorm';
import { ChatBotController } from './modules/chatbot';
import { Telegraf } from 'telegraf';

@Module({
  imports: [
    ChatBotModule,
    OpenAIModule,
    UserModule,
    TypeOrmModule.forRoot(databaseConfig),
  ],
  providers: [Telegraf],
  controllers: [ChatBotController],
})
export class AppModule {}
