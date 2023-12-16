import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatBotModule } from './modules/chatbot/chatbot.module';
import { OpenAIModule } from './modules/openai/openai.module';
import { UserModule } from './modules/user/user.module';
import { databaseConfig } from './config/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatBotController } from './modules/chatbot/chatbot.controller';

@Module({
  imports: [
    ChatBotModule,
    OpenAIModule,
    UserModule,
    TypeOrmModule.forRoot(databaseConfig),
  ],
  controllers: [AppController, ChatBotController],
  providers: [AppService],
})
export class AppModule {}
