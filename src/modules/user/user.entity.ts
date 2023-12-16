import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  token: string;

  @Column({ nullable: true })
  threadId: string;

  @Column({ nullable: true })
  assistantId: string;

  @Column({ nullable: true })
  runId: string;
}
