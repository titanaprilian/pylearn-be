/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "Material" (
    "id" BIGSERIAL NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "materialType" TEXT NOT NULL,
    "content" TEXT,
    "sourceUrl" TEXT,
    "iconName" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialLevel" (
    "id" BIGSERIAL NOT NULL,
    "materialId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "levelOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialLevel_materialId_levelOrder_key" ON "MaterialLevel"("materialId", "levelOrder");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialLevel" ADD CONSTRAINT "MaterialLevel_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
