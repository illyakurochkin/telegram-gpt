import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(private readonly entityManager: EntityManager) {}

  public async findOrCreateUser(userId: number) {
    return (
      (await this.entityManager.findOne(User, { where: { userId } })) ||
      (await this.entityManager.save(User, { userId }))
    );
  }

  public async resetUser(user: User) {
    user.threadId = null;
    user.runId = null;

    await this.entityManager.save(user);
  }

  public async updateUser(user: User) {
    await this.entityManager.save(user);
  }
}
