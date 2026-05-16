/*
  Warnings:

  - A unique constraint covering the columns `[quizLevelId,studentId]` on the table `QuizAttempt` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `quizLevelId` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuizAttempt" DROP CONSTRAINT "QuizAttempt_quizId_fkey";

-- DropIndex
DROP INDEX "QuizAttempt_quizId_studentId_key";

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "quizLevelId" BIGINT NOT NULL,
ALTER COLUMN "quizId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttempt_quizLevelId_studentId_key" ON "QuizAttempt"("quizLevelId", "studentId");

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizLevelId_fkey" FOREIGN KEY ("quizLevelId") REFERENCES "QuizLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
