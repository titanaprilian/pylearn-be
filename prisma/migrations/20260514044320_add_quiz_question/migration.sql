-- CreateTable
CREATE TABLE "Quiz" (
    "id" BIGSERIAL NOT NULL,
    "materialLevelId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" BIGSERIAL NOT NULL,
    "quizId" BIGINT NOT NULL,
    "questionText" TEXT NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "questionOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_quizId_questionOrder_key" ON "QuizQuestion"("quizId", "questionOrder");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_materialLevelId_fkey" FOREIGN KEY ("materialLevelId") REFERENCES "MaterialLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
