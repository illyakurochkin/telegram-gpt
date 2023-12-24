import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatBotModule, OpenAIModule, UserModule } from './modules';
import { databaseConfig } from './config/typeorm';
import { LoggerService } from './modules/logger/logger.service';

@Module({
  imports: [
    ChatBotModule,
    OpenAIModule,
    UserModule,
    TypeOrmModule.forRoot(databaseConfig),
  ],
  providers: [
    {
      provide: LoggerService,
      useValue: new LoggerService('AppModule'),
    },
  ],
})
export class AppModule {}
