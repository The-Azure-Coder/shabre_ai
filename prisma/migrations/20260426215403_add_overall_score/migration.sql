/*
  Warnings:

  - Added the required column `checklist` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendations` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "checklist" JSONB NOT NULL,
ADD COLUMN     "overallScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recommendations" JSONB NOT NULL;
