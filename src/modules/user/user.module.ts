import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { EntityManager } from "typeorm";
import { SupabaseClient } from "@supabase/supabase-js";

@Module({
  imports: [EntityManager],
  providers: [
    UserService,
    {
      provide: SupabaseClient,
      useFactory: () =>
        new SupabaseClient(
          process.env.SUPABASE_PROJECT_URL,
          process.env.SUPABASE_API_KEY,
        ),
    },
  ],
  exports: [UserService],
})
export class UserModule {}
