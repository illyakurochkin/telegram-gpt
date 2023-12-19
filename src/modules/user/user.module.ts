import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { EntityManager } from 'typeorm';

@Module({
  imports: [EntityManager],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
