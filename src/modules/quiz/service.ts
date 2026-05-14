import { prisma } from "@/libs/prisma";
import type {
  CreateQuizInput,
  UpdateQuizInput,
  CreateQuizQuestionInput,
  UpdateQuizQuestionInput,
} from "./schema";
import type { Logger } from "pino";
import { InvalidTimeRangeError, CannotDeleteQuestionError } from "./error";

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

export const SAFE_QUESTION_SELECT = {
  id: true,
  quizId: true,
  questionText: true,
  maxScore: true,
  questionOrder: true,
  createdAt: true,
  updatedAt: true,
  quiz: {
    select: {
      title: true,
    },
  },
} as const;

export abstract class QuizQuestionService {
  static async getQuestions(quizId: bigint, log: Logger) {
    log.debug({ quizId: quizId.toString() }, "Fetching questions for quiz");

    const questions = await prisma.quizQuestion.findMany({
      where: { quizId },
      select: SAFE_QUESTION_SELECT,
      orderBy: { questionOrder: "asc" },
    });

    log.info(
      { quizId: quizId.toString(), count: questions.length },
      "Questions retrieved successfully",
    );

    return questions.map((q) => ({
      id: q.id.toString(),
      quizId: q.quizId.toString(),
      quizTitle: q.quiz.title,
      questionText: q.questionText,
      maxScore: q.maxScore,
      questionOrder: q.questionOrder,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));
  }

  static async createQuestion(
    quizId: bigint,
    data: CreateQuizQuestionInput,
    log: Logger,
  ) {
    log.debug(
      { quizId: quizId.toString(), questionText: data.questionText },
      "Creating new quiz question",
    );

    const maxOrder = await prisma.quizQuestion.aggregate({
      where: { quizId },
      _max: { questionOrder: true },
    });

    const newOrder = (maxOrder._max.questionOrder ?? 0) + 1;

    const question = await prisma.quizQuestion.create({
      data: {
        quizId,
        questionText: data.questionText,
        maxScore: data.maxScore ?? 100,
        questionOrder: newOrder,
      },
      select: SAFE_QUESTION_SELECT,
    });

    log.info(
      {
        quizId: quizId.toString(),
        questionId: question.id.toString(),
        order: newOrder,
      },
      "Quiz question created successfully",
    );

    return {
      id: question.id.toString(),
      quizId: question.quizId.toString(),
      quizTitle: question.quiz.title,
      questionText: question.questionText,
      maxScore: question.maxScore,
      questionOrder: question.questionOrder,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  }

  static async updateQuestion(
    quizId: bigint,
    questionId: bigint,
    data: UpdateQuizQuestionInput,
    log: Logger,
  ) {
    log.debug(
      { quizId: quizId.toString(), questionId: questionId.toString() },
      "Updating quiz question",
    );

    const question = await prisma.quizQuestion.update({
      where: { id: questionId, quizId },
      data: {
        questionText: data.questionText,
        maxScore: data.maxScore,
      },
      select: SAFE_QUESTION_SELECT,
    });

    log.info(
      { questionId: question.id.toString() },
      "Quiz question updated successfully",
    );

    return {
      id: question.id.toString(),
      quizId: question.quizId.toString(),
      quizTitle: question.quiz.title,
      questionText: question.questionText,
      maxScore: question.maxScore,
      questionOrder: question.questionOrder,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  }

  static async deleteQuestion(quizId: bigint, questionId: bigint, log: Logger) {
    log.debug(
      { quizId: quizId.toString(), questionId: questionId.toString() },
      "Deleting quiz question",
    );

    const question = await prisma.quizQuestion.findFirst({
      where: { id: questionId, quizId },
      select: { questionOrder: true },
    });

    if (!question) {
      throw new Prisma.PrismaClientKnownRequestError("Question not found", {
        code: "P2025",
        clientVersion: "6.5.0",
      });
    }

    const maxOrder = await prisma.quizQuestion.aggregate({
      where: { quizId },
      _max: { questionOrder: true },
    });

    if (question.questionOrder !== maxOrder._max.questionOrder) {
      throw new CannotDeleteQuestionError();
    }

    await prisma.quizQuestion.delete({
      where: { id: questionId },
    });

    log.info(
      { questionId: questionId.toString() },
      "Quiz question deleted successfully",
    );

    return {
      id: questionId.toString(),
    };
  }
}
