/*
  Warnings:

  - You are about to drop the column `quizId` on the `QuizQuestion` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuizQuestion" DROP CONSTRAINT "QuizQuestion_quizId_fkey";

-- AlterTable
ALTER TABLE "QuizQuestion" DROP COLUMN "quizId";
