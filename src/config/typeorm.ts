import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
};
