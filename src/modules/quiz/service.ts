import { prisma } from "@/libs/prisma";
import type { CreateQuizInput, UpdateQuizInput } from "./schema";
import type { Logger } from "pino";
import { InvalidTimeRangeError } from "./error";

export const SAFE_QUIZ_SELECT = {
  id: true,
  materialLevelId: true,
  title: true,
  description: true,
  startTime: true,
  endTime: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  materialLevel: {
    select: {
      id: true,
      title: true,
      material: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
} as const;

export abstract class QuizService {
  static async getQuizzes(materialLevelId: bigint, log: Logger) {
    log.debug(
      { materialLevelId: materialLevelId.toString() },
      "Fetching quizzes for level",
    );

    const quizzes = await prisma.quiz.findMany({
      where: { materialLevelId },
      select: SAFE_QUIZ_SELECT,
      orderBy: { createdAt: "desc" },
    });

    log.info(
      { materialLevelId: materialLevelId.toString(), count: quizzes.length },
      "Quizzes retrieved successfully",
    );

    return quizzes.map((quiz) => ({
      id: quiz.id.toString(),
      materialLevelId: quiz.materialLevelId.toString(),
      materialId: quiz.materialLevel.material.id.toString(),
      level: quiz.materialLevel.title,
      material: quiz.materialLevel.material.title,
      title: quiz.title,
      description: quiz.description ?? null,
      startTime: quiz.startTime?.toISOString() ?? null,
      endTime: quiz.endTime?.toISOString() ?? null,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
    }));
  }

  static async getQuiz(materialLevelId: bigint, quizId: bigint, log: Logger) {
    log.debug(
      {
        materialLevelId: materialLevelId.toString(),
        quizId: quizId.toString(),
      },
      "Fetching quiz details",
    );

    const quiz = await prisma.quiz.findFirstOrThrow({
      where: { id: quizId, materialLevelId },
      select: SAFE_QUIZ_SELECT,
    });

    log.info(
      { quizId: quiz.id.toString(), title: quiz.title },
      "Quiz details retrieved successfully",
    );

    return {
      id: quiz.id.toString(),
      materialLevelId: quiz.materialLevelId.toString(),
      materialId: quiz.materialLevel.material.id.toString(),
      level: quiz.materialLevel.title,
      material: quiz.materialLevel.material.title,
      title: quiz.title,
      description: quiz.description ?? null,
      startTime: quiz.startTime?.toISOString() ?? null,
      endTime: quiz.endTime?.toISOString() ?? null,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
    };
  }

  static async createQuiz(
    materialLevelId: bigint,
    data: CreateQuizInput,
    log: Logger,
  ) {
    log.debug(
      { materialLevelId: materialLevelId.toString(), title: data.title },
      "Creating new quiz",
    );

    if (data.startTime && data.endTime) {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      if (startTime >= endTime) {
        throw new InvalidTimeRangeError();
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        materialLevelId,
        title: data.title,
        description: data.description,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        isPublished: data.isPublished ?? false,
      },
      select: {
        id: true,
        materialLevelId: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    log.info(
      { quizId: quiz.id.toString(), title: quiz.title },
      "Quiz created successfully",
    );

    return {
      id: quiz.id.toString(),
      materialLevelId: quiz.materialLevelId.toString(),
      title: quiz.title,
      description: quiz.description ?? null,
      startTime: quiz.startTime?.toISOString() ?? null,
      endTime: quiz.endTime?.toISOString() ?? null,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
    };
  }

  static async updateQuiz(
    materialLevelId: bigint,
    quizId: bigint,
    data: UpdateQuizInput,
    log: Logger,
  ) {
    log.debug(
      {
        materialLevelId: materialLevelId.toString(),
        quizId: quizId.toString(),
      },
      "Updating quiz",
    );

    const existing = await prisma.quiz.findFirst({
      where: { id: quizId, materialLevelId },
      select: { startTime: true, endTime: true },
    });

    const startTime = data.startTime
      ? new Date(data.startTime)
      : (existing?.startTime ?? null);
    const endTime = data.endTime
      ? new Date(data.endTime)
      : (existing?.endTime ?? null);

    if (startTime && endTime && startTime >= endTime) {
      throw new InvalidTimeRangeError();
    }

    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        isPublished: data.isPublished,
      },
      select: {
        id: true,
        materialLevelId: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    log.info(
      { quizId: quiz.id.toString(), title: quiz.title },
      "Quiz updated successfully",
    );

    return {
      id: quiz.id.toString(),
      materialLevelId: quiz.materialLevelId.toString(),
      title: quiz.title,
      description: quiz.description ?? null,
      startTime: quiz.startTime?.toISOString() ?? null,
      endTime: quiz.endTime?.toISOString() ?? null,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
    };
  }

  static async deleteQuiz(
    materialLevelId: bigint,
    quizId: bigint,
    log: Logger,
  ) {
    log.debug(
      {
        materialLevelId: materialLevelId.toString(),
        quizId: quizId.toString(),
      },
      "Deleting quiz",
    );

    const quiz = await prisma.quiz.delete({
      where: { id: quizId },
      select: { id: true },
    });

    log.info({ quizId: quiz.id.toString() }, "Quiz deleted successfully");

    return {
      id: quiz.id.toString(),
    };
  }
}
