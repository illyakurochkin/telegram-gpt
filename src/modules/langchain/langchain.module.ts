import { Module } from '@nestjs/common';
import { LangchainService } from './langchain.service';

@Module({
  providers: [LangchainService],
  exports: [LangchainModule],
})
export class LangchainModule {}
