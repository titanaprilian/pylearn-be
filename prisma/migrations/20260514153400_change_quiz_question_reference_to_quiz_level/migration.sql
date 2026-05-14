/*
  Warnings:

  - A unique constraint covering the columns `[quizLevelId,questionOrder]` on the table `QuizQuestion` will be added. If there are existing duplicate values, this will fail.
  - Made the column `quizLevelId` on table `QuizQuestion` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "QuizQuestion" DROP CONSTRAINT "QuizQuestion_quizId_fkey";

-- DropForeignKey
ALTER TABLE "QuizQuestion" DROP CONSTRAINT "QuizQuestion_quizLevelId_fkey";

-- DropIndex
DROP INDEX "QuizQuestion_quizId_questionOrder_key";

-- AlterTable
ALTER TABLE "QuizQuestion" ALTER COLUMN "quizId" DROP NOT NULL,
ALTER COLUMN "quizLevelId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_quizLevelId_questionOrder_key" ON "QuizQuestion"("quizLevelId", "questionOrder");

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizLevelId_fkey" FOREIGN KEY ("quizLevelId") REFERENCES "QuizLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
