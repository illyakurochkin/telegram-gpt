import { Injectable, Logger } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { User } from "./user.entity";
import { SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly supabaseClient: SupabaseClient,
  ) {}

  public async findAllUsers() {
    return this.entityManager.find(User);
  }

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

    await this.supabaseClient
      .from("messages")
      .delete()
      .eq("metadata", { userId: user.id });
  }

  public async setUserToken(user: User, token: string) {
    user.token = token;
    await this.entityManager.save(user);
  }

  public async updateUser(user: User) {
    await this.entityManager.save(user);
  }

  public async resetUserRun(user: User) {
    user.runId = null;
    await this.entityManager.save(user);
  }
}
