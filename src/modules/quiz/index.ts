import { QuizService, QuizQuestionService } from "./service";
import { QuizModel } from "./model";
import {
  CreateQuizSchema,
  UpdateQuizSchema,
  QuizParamSchema,
  QuizListParamSchema,
  CreateQuizQuestionSchema,
  UpdateQuizQuestionSchema,
  QuestionParamSchema,
} from "./schema";
import { successResponse, errorResponse } from "@/libs/response";
import { createBaseApp, createProtectedApp } from "@/libs/base";
import { Prisma } from "@generated/prisma";
import { hasPermission } from "@/middleware/permission";
import { InvalidTimeRangeError, CannotDeleteQuestionError } from "./error";

const FEATURE_NAME = "quiz_management";

const protectedQuizzes = createProtectedApp()
  .get(
    "/",
    async ({ params, set, log, locale }) => {
      const materialLevelId = BigInt(params.levelId);
      const quizzes = await QuizService.getQuizzes(materialLevelId, log);
      return successResponse(
        set,
        quizzes,
        { key: "quiz.listSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      params: QuizListParamSchema,
      response: {
        200: QuizModel.quizzes,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "read"),
    },
  )
  .post(
    "/",
    async ({ params, body, set, log, locale }) => {
      const materialLevelId = BigInt(params.levelId);
      const quiz = await QuizService.createQuiz(materialLevelId, body, log);
      return successResponse(
        set,
        quiz,
        { key: "quiz.createSuccess" },
        201,
        undefined,
        locale,
      );
    },
    {
      params: QuizListParamSchema,
      body: CreateQuizSchema,
      response: {
        201: QuizModel.createResult,
        400: QuizModel.validationError,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "create"),
    },
  )
  .get(
    "/:quizId",
    async ({ params, set, log, locale }) => {
      const materialLevelId = BigInt(params.levelId);
      const quizId = BigInt(params.quizId);
      const quiz = await QuizService.getQuiz(materialLevelId, quizId, log);
      return successResponse(
        set,
        quiz,
        { key: "quiz.getSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      params: QuizParamSchema,
      response: {
        200: QuizModel.quiz,
        404: QuizModel.error,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "read"),
    },
  )
  .patch(
    "/:quizId",
    async ({ params, body, set, log, locale }) => {
      const materialLevelId = BigInt(params.levelId);
      const quizId = BigInt(params.quizId);
      const quiz = await QuizService.updateQuiz(
        materialLevelId,
        quizId,
        body,
        log,
      );
      return successResponse(
        set,
        quiz,
        { key: "quiz.updateSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      params: QuizParamSchema,
      body: UpdateQuizSchema,
      response: {
        200: QuizModel.updateResult,
        400: QuizModel.validationError,
        404: QuizModel.error,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "update"),
    },
  )
  .delete(
    "/:quizId",
    async ({ params, set, log, locale }) => {
      const materialLevelId = BigInt(params.levelId);
      const quizId = BigInt(params.quizId);
      const result = await QuizService.deleteQuiz(materialLevelId, quizId, log);
      return successResponse(
        set,
        result,
        { key: "quiz.deleteSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      params: QuizParamSchema,
      response: {
        200: QuizModel.deleteResult,
        404: QuizModel.error,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "delete"),
    },
  )

  // Nested routes for Questions
  .get(
    "/:quizId/questions",
    async ({ params, set, log, locale }) => {
      const quizId = BigInt(params.quizId);
      const questions = await QuizQuestionService.getQuestions(quizId, log);
      return successResponse(
        set,
        questions,
        { key: "quiz.questionListSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      params: QuizParamSchema,
      response: {
        200: QuizModel.questions,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "read"),
    },
  )
  .post(
    "/:quizId/questions",
    async ({ params, body, set, log, locale }) => {
      const quizId = BigInt(params.quizId);
      const question = await QuizQuestionService.createQuestion(
        quizId,
        body,
        log,
      );
      return successResponse(
        set,
        question,
        { key: "quiz.questionCreateSuccess" },
        201,
        undefined,
        locale,
      );
    },
    {
      params: QuizParamSchema,
      body: CreateQuizQuestionSchema,
      response: {
        201: QuizModel.createQuestionResult,
        400: QuizModel.validationError,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "create"),
    },
  )
  .patch(
    "/:quizId/questions/:questionId",
    async ({ params, body, set, log, locale }) => {
      const quizId = BigInt(params.quizId);
      const questionId = BigInt(params.questionId);
      const question = await QuizQuestionService.updateQuestion(
        quizId,
        questionId,
        body,
        log,
      );
      return successResponse(
        set,
        question,
        { key: "quiz.questionUpdateSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      params: QuestionParamSchema,
      body: UpdateQuizQuestionSchema,
      response: {
        200: QuizModel.updateQuestionResult,
        400: QuizModel.validationError,
        404: QuizModel.error,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "update"),
    },
  )
  .delete(
    "/:quizId/questions/:questionId",
    async ({ params, set, log, locale }) => {
      const quizId = BigInt(params.quizId);
      const questionId = BigInt(params.questionId);
      const result = await QuizQuestionService.deleteQuestion(
        quizId,
        questionId,
        log,
      );
      return successResponse(
        set,
        result,
        { key: "quiz.questionDeleteSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      params: QuestionParamSchema,
      response: {
        200: QuizModel.deleteQuestionResult,
        404: QuizModel.error,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "delete"),
    },
  )
  .onError(({ error, set, locale }) => {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return errorResponse(set, 404, { key: "common.notFound" }, null, locale);
    }

    if (error instanceof InvalidTimeRangeError) {
      return errorResponse(set, 400, error.message, null, locale);
    }

    if (error instanceof CannotDeleteQuestionError) {
      return errorResponse(set, 400, error.message, null, locale);
    }

    return;
  });

export const quizzes = createBaseApp({ tags: ["Quizzes"] }).group(
  "/materials/:id/levels/:levelId/quizzes",
  (app) => app.use(protectedQuizzes),
);
