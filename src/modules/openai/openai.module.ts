import { Module } from '@nestjs/common';
import { OpenAI } from 'openai';
import { OpenAIService } from './openai.service';

@Module({
  providers: [
    OpenAIService,
    {
      provide: OpenAI,
      useFactory: () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    },
  ],
  exports: [OpenAIService],
})
export class OpenAIModule {}
