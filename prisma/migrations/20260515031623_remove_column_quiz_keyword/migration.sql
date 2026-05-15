/*
  Warnings:

  - You are about to drop the `QuestionKeyword` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuestionKeyword" DROP CONSTRAINT "QuestionKeyword_questionId_fkey";

-- DropTable
DROP TABLE "QuestionKeyword";
