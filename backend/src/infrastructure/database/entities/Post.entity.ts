// backend/src/infrastructure/database/entities/Post.entity.ts (Updated - Remove isAnnouncement)
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './User.entity';

@Entity('posts')
export class PostEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column('text')
  content!: string;

  @Column({ default: '' })
    mediaUrls!: string;

  @Column({ default: 0 })
  likesCount!: number;

  // True only for the labeled example threads made by src/scripts/sampleCommunityPosts.ts.
  // Real posts never set it; the UI shows a 「サンプル投稿」 badge when it is true.
  @Column({ default: false })
  isSample!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}