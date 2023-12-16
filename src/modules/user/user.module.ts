import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { EntityManager } from 'typeorm';

@Module({
  imports: [EntityManager],
  providers: [UserService],
})
export class UserModule {}
