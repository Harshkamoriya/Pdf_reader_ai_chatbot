/*
  Warnings:

  - The values [COMPLETED] on the enum `InterviewStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InterviewStatus_new" AS ENUM ('NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'ENDED', 'FAILED');
ALTER TABLE "public"."InterviewSession" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "InterviewSession" ALTER COLUMN "status" TYPE "InterviewStatus_new" USING ("status"::text::"InterviewStatus_new");
ALTER TYPE "InterviewStatus" RENAME TO "InterviewStatus_old";
ALTER TYPE "InterviewStatus_new" RENAME TO "InterviewStatus";
DROP TYPE "public"."InterviewStatus_old";
ALTER TABLE "InterviewSession" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
