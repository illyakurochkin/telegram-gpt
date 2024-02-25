import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatBotModule, OpenAIModule, UserModule } from "./modules";
import { databaseConfig } from "./config/typeorm";

@Module({
  imports: [
    ChatBotModule,
    OpenAIModule,
    UserModule,
    TypeOrmModule.forRoot(databaseConfig),
  ],
})
export class AppModule {}
