/*
  Warnings:

  - Added the required column `qrCodeData` to the `QRCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QRCode" ADD COLUMN     "qrCodeData" TEXT NOT NULL;
