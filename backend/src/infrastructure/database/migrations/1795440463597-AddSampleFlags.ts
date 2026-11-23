import { MigrationInterface, QueryRunner } from "typeorm";

// Marks the labeled example threads in the community (「サンプル投稿」).
// Additive: existing rows get false, so no real post or comment shows the badge.
export class AddSampleFlags1795440463597 implements MigrationInterface {
    name = 'AddSampleFlags1795440463597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "isSample" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "comment" ADD COLUMN IF NOT EXISTS "isSample" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" DROP COLUMN IF EXISTS "isSample"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "isSample"`);
    }
}
