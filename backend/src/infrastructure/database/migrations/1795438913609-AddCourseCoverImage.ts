import { MigrationInterface, QueryRunner } from "typeorm";

// Optional main cover image for a course (16:9). Nullable, so existing rows keep working.
export class AddCourseCoverImage1795438913609 implements MigrationInterface {
    name = 'AddCourseCoverImage1795438913609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "coverImageUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "coverImageUrl"`);
    }
}
