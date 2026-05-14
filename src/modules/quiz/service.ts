import { prisma } from "@/libs/prisma";
import type {
  CreateQuizInput,
  UpdateQuizInput,
  CreateQuizQuestionInput,
  UpdateQuizQuestionInput,
  CreateKeywordInput,
  UpdateKeywordInput,
  CreateQuizLevelInput,
  UpdateQuizLevelInput,
} from "./schema";
import type { Logger } from "pino";
import { InvalidTimeRangeError } from "./error";
import { Prisma } from "@generated/prisma";

export const SAFE_QUIZ_SELECT = {
  id: true,
  materialId: true,
  title: true,
  description: true,
  startTime: true,
  endTime: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  // Fetching the parent material directly
  material: {
    select: {
      id: true,
      title: true,
    },
  },
  levels: {
    select: {
      id: true,
      quizId: true,
      title: true,
      levelOrder: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      levelOrder: "asc",
    },
  },
} as const;

export abstract class QuizService {
  static async getQuizzes(materialId: bigint, log: Logger) {
    log.debug(
      { materialId: materialId.toString() },
      "Fetching quizzes for material",
    );

    const quizzes = await prisma.quiz.findMany({
      where: { materialId: materialId },
      select: SAFE_QUIZ_SELECT,
      orderBy: { createdAt: "desc" },
    });

    log.info(
      { materialId: materialId.toString(), count: quizzes.length },
      "Quizzes retrieved successfully",
    );

    return quizzes.map((quiz) => ({
      id: quiz.id.toString(),
      materialId: quiz.materialId.toString(),
      material: quiz.material.title,
      title: quiz.title,
      description: quiz.description ?? null,
      startTime: quiz.startTime?.toISOString() ?? null,
      endTime: quiz.endTime?.toISOString() ?? null,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
      levels: quiz.levels.map((level) => ({
        id: level.id.toString(),
        quizId: level.quizId.toString(),
        title: level.title,
        levelOrder: level.levelOrder,
        createdAt: level.createdAt.toISOString(),
        updatedAt: level.updatedAt.toISOString(),
      })),
    }));
  }

  static async getQuiz(quizId: bigint, log: Logger) {
    log.debug(
      {
        quizId: quizId.toString(),
      },
      "Fetching quiz details",
    );

    const quiz = await prisma.quiz.findUniqueOrThrow({
      where: { id: quizId },
      select: SAFE_QUIZ_SELECT,
    });

    log.info(
      { quizId: quiz.id.toString(), title: quiz.title },
      "Quiz details retrieved successfully",
    );

    return {
      id: quiz.id.toString(),
      materialId: quiz.materialId.toString(),
      material: quiz.material.title,
      title: quiz.title,
      description: quiz.description ?? null,
      startTime: quiz.startTime?.toISOString() ?? null,
      endTime: quiz.endTime?.toISOString() ?? null,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),

      levels: quiz.levels.map((level) => ({
        id: level.id.toString(),
        title: level.title,
        levelOrder: level.levelOrder,
      })),
    };
  }

  static async createQuiz(data: CreateQuizInput, log: Logger) {
    const materialId = BigInt(data.materialId);
    log.debug(
      { materialId: materialId.toString(), title: data.title },
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
        materialId: materialId,
        title: data.title,
        description: data.description,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        isPublished: data.isPublished ?? false,
      },
      select: {
        id: true,
        materialId: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        levels: {
          select: {
            id: true,
            quizId: true,
            title: true,
            levelOrder: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            levelOrder: "asc",
          },
        },
      },
    });

    log.info(
      { quizId: quiz.id.toString(), title: quiz.title },
      "Quiz created successfully",
    );

    return {
      id: quiz.id.toString(),
      materialId: quiz.materialId.toString(), // Updated field
      title: quiz.title,
      description: quiz.description ?? null,
      startTime: quiz.startTime?.toISOString() ?? null,
      endTime: quiz.endTime?.toISOString() ?? null,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
      levels: quiz.levels.map((level) => ({
        id: level.id.toString(),
        quizId: level.quizId.toString(),
        title: level.title,
        levelOrder: level.levelOrder,
        createdAt: level.createdAt.toISOString(),
        updatedAt: level.updatedAt.toISOString(),
      })),
    };
  }

  static async updateQuiz(quizId: bigint, data: UpdateQuizInput, log: Logger) {
    log.debug(
      {
        quizId: quizId.toString(),
      },
      "Updating quiz",
    );

    const existing = await prisma.quiz.findUnique({
      where: { id: quizId },
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
        materialId: true, // Updated selection from materialLevelId
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        levels: {
          // Added to keep the return payload consistent
          select: {
            id: true,
            title: true,
            levelOrder: true,
          },
        },
      },
    });

    log.info(
      { quizId: quiz.id.toString(), title: quiz.title },
      "Quiz updated successfully",
    );

    return {
      id: quiz.id.toString(),
      materialId: quiz.materialId.toString(), // Updated field
      title: quiz.title,
      description: quiz.description ?? null,
      startTime: quiz.startTime?.toISOString() ?? null,
      endTime: quiz.endTime?.toISOString() ?? null,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
      levels: quiz.levels.map((level) => ({
        id: level.id.toString(),
        title: level.title,
        levelOrder: level.levelOrder,
      })),
    };
  }

  static async deleteQuiz(quizId: bigint, log: Logger) {
    log.debug(
      {
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
  answerText: true,
  maxScore: true,
  questionOrder: true,
  createdAt: true,
  updatedAt: true,
  quiz: {
    select: {
      id: true,
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
      answerText: q.answerText,
      maxScore: q.maxScore,
      questionOrder: q.questionOrder,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));
  }

  static async createQuestion(data: CreateQuizQuestionInput, log: Logger) {
    const quizId = BigInt(data.quizId);
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
        answerText: data.answerText,
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
      answerText: question.answerText,
      maxScore: question.maxScore,
      questionOrder: question.questionOrder,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  }

  static async updateQuestion(
    questionId: bigint,
    data: UpdateQuizQuestionInput,
    log: Logger,
  ) {
    log.debug({ questionId: questionId.toString() }, "Updating quiz question");

    const question = await prisma.quizQuestion.update({
      where: { id: questionId },
      data: {
        questionText: data.questionText,
        answerText: data.answerText,
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
      answerText: question.answerText,
      maxScore: question.maxScore,
      questionOrder: question.questionOrder,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  }

  static async deleteQuestion(questionId: bigint, log: Logger) {
    log.debug({ questionId: questionId.toString() }, "Deleting quiz question");

    return await prisma.$transaction(async (tx) => {
      const question = await tx.quizQuestion.findUnique({
        where: { id: questionId },
        select: { quizId: true, questionOrder: true },
      });

      if (!question) {
        throw new Prisma.PrismaClientKnownRequestError("Question not found", {
          code: "P2025",
          clientVersion: "6.5.0",
        });
      }

      // Delete the targeted question
      await tx.quizQuestion.delete({ where: { id: questionId } });

      // Shift all sequential questions down by 1 to maintain structural continuity
      await tx.quizQuestion.updateMany({
        where: {
          quizId: question.quizId,
          questionOrder: { gt: question.questionOrder },
        },
        data: {
          questionOrder: { decrement: 1 },
        },
      });

      log.info(
        { questionId: questionId.toString() },
        "Quiz question deleted and sequence reordered",
      );
      return { id: questionId.toString() };
    });
  }
}

export const SAFE_KEYWORD_SELECT = {
  id: true,
  questionId: true,
  blankOrder: true,
  correctAnswer: true,
  createdAt: true,
  updatedAt: true,
  question: {
    select: {
      id: true,
      quiz: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
} as const;

export abstract class QuestionKeywordService {
  static async getKeywords(questionId: bigint, log: Logger) {
    log.debug(
      { questionId: questionId.toString() },
      "Fetching keywords for question",
    );

    const keywords = await prisma.questionKeyword.findMany({
      where: { questionId },
      select: SAFE_KEYWORD_SELECT,
      orderBy: { blankOrder: "asc" },
    });

    log.info(
      { questionId: questionId.toString(), count: keywords.length },
      "Keywords retrieved successfully",
    );

    return keywords.map((k) => ({
      id: k.id.toString(),
      questionId: k.questionId.toString(),
      quizId: k.question.quiz.id.toString(),
      quizTitle: k.question.quiz.title,
      blankOrder: k.blankOrder,
      correctAnswer: k.correctAnswer,
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt.toISOString(),
    }));
  }

  static async createKeyword(data: CreateKeywordInput, log: Logger) {
    const questionId = BigInt(data.questionId);
    log.debug(
      { questionId: questionId.toString(), blankOrder: data.blankOrder },
      "Creating new keyword",
    );

    const keyword = await prisma.questionKeyword.create({
      data: {
        questionId,
        blankOrder: data.blankOrder,
        correctAnswer: data.correctAnswer,
      },
      select: SAFE_KEYWORD_SELECT,
    });

    log.info(
      { keywordId: keyword.id.toString(), blankOrder: keyword.blankOrder },
      "Keyword created successfully",
    );

    return {
      id: keyword.id.toString(),
      questionId: keyword.questionId.toString(),
      quizId: keyword.question.quiz.id.toString(),
      quizTitle: keyword.question.quiz.title,
      blankOrder: keyword.blankOrder,
      correctAnswer: keyword.correctAnswer,
      createdAt: keyword.createdAt.toISOString(),
      updatedAt: keyword.updatedAt.toISOString(),
    };
  }

  static async updateKeyword(
    keywordId: bigint,
    data: UpdateKeywordInput,
    log: Logger,
  ) {
    log.debug({ keywordId: keywordId.toString() }, "Updating keyword");

    const keyword = await prisma.questionKeyword.update({
      where: { id: keywordId },
      data: {
        blankOrder: data.blankOrder,
        correctAnswer: data.correctAnswer,
      },
      select: SAFE_KEYWORD_SELECT,
    });

    log.info(
      { keywordId: keyword.id.toString() },
      "Keyword updated successfully",
    );

    return {
      id: keyword.id.toString(),
      questionId: keyword.questionId.toString(),
      quizId: keyword.question.quiz.id.toString(),
      quizTitle: keyword.question.quiz.title,
      blankOrder: keyword.blankOrder,
      correctAnswer: keyword.correctAnswer,
      createdAt: keyword.createdAt.toISOString(),
      updatedAt: keyword.updatedAt.toISOString(),
    };
  }

  static async deleteKeyword(keywordId: bigint, log: Logger) {
    log.debug({ keywordId: keywordId.toString() }, "Deleting keyword");

    const keyword = await prisma.questionKeyword.delete({
      where: { id: keywordId },
      select: { id: true },
    });

    log.info(
      { keywordId: keyword.id.toString() },
      "Keyword deleted successfully",
    );

    return {
      id: keyword.id.toString(),
    };
  }
}

export const SAFE_LEVEL_SELECT = {
  id: true,
  quizId: true,
  title: true,
  levelOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

export abstract class QuizLevelService {
  static async getQuizLevels(quizId: bigint, log: Logger) {
    log.debug({ quizId: quizId.toString() }, "Fetching quiz levels for quiz");

    const levels = await prisma.quizLevel.findMany({
      where: { quizId: quizId },
      select: SAFE_LEVEL_SELECT,
      orderBy: { levelOrder: "asc" },
    });

    log.info(
      { quizId: quizId.toString(), count: levels.length },
      "Quiz levels retrieved successfully",
    );

    return levels.map((level) => ({
      id: level.id.toString(),
      quizId: level.quizId.toString(),
      title: level.title,
      levelOrder: level.levelOrder,
      createdAt: level.createdAt.toISOString(),
      updatedAt: level.updatedAt.toISOString(),
    }));
  }

  static async getQuizLevel(levelId: bigint, log: Logger) {
    log.debug({ levelId: levelId.toString() }, "Fetching quiz level details");

    const level = await prisma.quizLevel.findUniqueOrThrow({
      where: { id: levelId },
      select: SAFE_LEVEL_SELECT,
    });

    log.info(
      { levelId: level.id.toString(), title: level.title },
      "Quiz level details retrieved successfully",
    );

    return {
      id: level.id.toString(),
      quizId: level.quizId.toString(),
      title: level.title,
      levelOrder: level.levelOrder,
      createdAt: level.createdAt.toISOString(),
      updatedAt: level.updatedAt.toISOString(),
    };
  }

  static async createQuizLevel(data: CreateQuizLevelInput, log: Logger) {
    const quizId = BigInt(data.quizId);
    log.debug(
      { quizId: quizId.toString(), title: data.title, order: data.levelOrder },
      "Creating new quiz level",
    );

    const level = await prisma.quizLevel.create({
      data: {
        quizId: quizId,
        title: data.title,
        levelOrder: data.levelOrder,
      },
      select: SAFE_LEVEL_SELECT,
    });

    log.info(
      { levelId: level.id.toString(), title: level.title },
      "Quiz level created successfully",
    );

    return {
      id: level.id.toString(),
      quizId: level.quizId.toString(),
      title: level.title,
      levelOrder: level.levelOrder,
      createdAt: level.createdAt.toISOString(),
      updatedAt: level.updatedAt.toISOString(),
    };
  }

  static async updateQuizLevel(
    levelId: bigint,
    data: UpdateQuizLevelInput,
    log: Logger,
  ) {
    log.debug({ levelId: levelId.toString() }, "Updating quiz level");

    const level = await prisma.quizLevel.update({
      where: { id: levelId },
      data: {
        title: data.title,
        levelOrder: data.levelOrder,
      },
      select: SAFE_LEVEL_SELECT,
    });

    log.info(
      { levelId: level.id.toString(), title: level.title },
      "Quiz level updated successfully",
    );

    return {
      id: level.id.toString(),
      quizId: level.quizId.toString(),
      title: level.title,
      levelOrder: level.levelOrder,
      createdAt: level.createdAt.toISOString(),
      updatedAt: level.updatedAt.toISOString(),
    };
  }

  // ==========================================
  // 5. DELETE A QUIZ LEVEL
  // ==========================================
  static async deleteQuizLevel(levelId: bigint, log: Logger) {
    log.debug({ levelId: levelId.toString() }, "Deleting quiz level");

    const level = await prisma.quizLevel.delete({
      where: { id: levelId },
      select: { id: true },
    });

    log.info(
      { levelId: level.id.toString() },
      "Quiz level deleted successfully",
    );

    return {
      id: level.id.toString(),
    };
  }
}
