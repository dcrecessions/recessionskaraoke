/*
  Warnings:

  - The values [PENDING,APPROVED,REJECTED] on the enum `QRStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QRStatus_new" AS ENUM ('UPDATED', 'NEW');
ALTER TABLE "QRCode" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "QRCode" ALTER COLUMN "status" TYPE "QRStatus_new" USING ("status"::text::"QRStatus_new");
ALTER TYPE "QRStatus" RENAME TO "QRStatus_old";
ALTER TYPE "QRStatus_new" RENAME TO "QRStatus";
DROP TYPE "QRStatus_old";
ALTER TABLE "QRCode" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "QRCode" ALTER COLUMN "status" SET DEFAULT 'NEW';
