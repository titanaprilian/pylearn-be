/*
  Warnings:

  - You are about to drop the column `materialLevelId` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the `MaterialLevel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `materialId` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MaterialLevel" DROP CONSTRAINT "MaterialLevel_materialId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_materialLevelId_fkey";

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "materialLevelId",
ADD COLUMN     "materialId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "quizLevelId" BIGINT;

-- DropTable
DROP TABLE "MaterialLevel";

-- CreateTable
CREATE TABLE "QuizLevel" (
    "id" BIGSERIAL NOT NULL,
    "quizId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "levelOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionKeyword" (
    "id" BIGSERIAL NOT NULL,
    "questionId" BIGINT NOT NULL,
    "blankOrder" INTEGER NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizLevel_quizId_levelOrder_key" ON "QuizLevel"("quizId", "levelOrder");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionKeyword_questionId_blankOrder_key" ON "QuestionKeyword"("questionId", "blankOrder");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizLevel" ADD CONSTRAINT "QuizLevel_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizLevelId_fkey" FOREIGN KEY ("quizLevelId") REFERENCES "QuizLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionKeyword" ADD CONSTRAINT "QuestionKeyword_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
