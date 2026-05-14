import {
  QuizService,
  QuizQuestionService,
  QuestionKeywordService,
} from "./service";
import { QuizModel } from "./model";
import {
  CreateQuizSchema,
  UpdateQuizSchema,
  QuizParamSchema,
  CreateQuizQuestionSchema,
  UpdateQuizQuestionSchema,
  QuestionParamSchema,
  KeywordParamSchema,
  CreateKeywordSchema,
  UpdateKeywordSchema,
  GetQuizzesQuerySchema,
  GetQuestionsQuerySchema,
  GetGroupedQuestionsQuerySchema,
  GetKeywordsQuerySchema,
} from "./schema";
import { successResponse, errorResponse } from "@/libs/response";
import { createBaseApp, createProtectedApp } from "@/libs/base";
import { Prisma } from "@generated/prisma";
import { hasPermission } from "@/middleware/permission";
import { InvalidTimeRangeError, CannotDeleteQuestionError } from "./error";

const FEATURE_NAME = "quiz_management";

const protectedQuizzes = createProtectedApp()
  // Quizzes
  .get(
    "/quizzes",
    async ({ query, set, log, locale }) => {
      const levelId = BigInt(query.levelId);
      const quizzes = await QuizService.getQuizzes(levelId, log);
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
      query: GetQuizzesQuerySchema,
      response: {
        200: QuizModel.quizzes,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "read"),
    },
  )
  .post(
    "/quizzes",
    async ({ body, set, log, locale }) => {
      const quiz = await QuizService.createQuiz(body, log);
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
    "/quizzes/:id",
    async ({ params, set, log, locale }) => {
      const quizId = BigInt(params.id);
      const quiz = await QuizService.getQuiz(quizId, log);
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
    "/quizzes/:id",
    async ({ params, body, set, log, locale }) => {
      const quizId = BigInt(params.id);
      const quiz = await QuizService.updateQuiz(quizId, body, log);
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
    "/quizzes/:id",
    async ({ params, set, log, locale }) => {
      const quizId = BigInt(params.id);
      const result = await QuizService.deleteQuiz(quizId, log);
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

  // Questions
  .get(
    "/questions",
    async ({ query, set, log, locale }) => {
      const quizId = BigInt(query.quizId);
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
      query: GetQuestionsQuerySchema,
      response: {
        200: QuizModel.questions,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "read"),
    },
  )
  .get(
    "/questions/grouped",
    async ({ query, set, log, locale }) => {
      const materialId = BigInt(query.materialId);
      const grouped = await QuizQuestionService.getGroupedQuestionsByMaterial(
        materialId,
        log,
      );
      return successResponse(
        set,
        grouped,
        { key: "quiz.questionListSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      query: GetGroupedQuestionsQuerySchema,
      response: {
        200: QuizModel.groupedQuestions,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "read"),
    },
  )
  .post(
    "/questions",
    async ({ body, set, log, locale }) => {
      const question = await QuizQuestionService.createQuestion(body, log);
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
    "/questions/:id",
    async ({ params, body, set, log, locale }) => {
      const questionId = BigInt(params.id);
      const question = await QuizQuestionService.updateQuestion(
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
    "/questions/:id",
    async ({ params, set, log, locale }) => {
      const questionId = BigInt(params.id);
      const result = await QuizQuestionService.deleteQuestion(questionId, log);
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

  // Keywords
  .get(
    "/keywords",
    async ({ query, set, log, locale }) => {
      const questionId = BigInt(query.questionId);
      const keywords = await QuestionKeywordService.getKeywords(
        questionId,
        log,
      );
      return successResponse(
        set,
        keywords,
        { key: "quiz.keywordListSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      query: GetKeywordsQuerySchema,
      response: {
        200: QuizModel.keywords,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "read"),
    },
  )
  .post(
    "/keywords",
    async ({ body, set, log, locale }) => {
      const keyword = await QuestionKeywordService.createKeyword(body, log);
      return successResponse(
        set,
        keyword,
        { key: "quiz.keywordCreateSuccess" },
        201,
        undefined,
        locale,
      );
    },
    {
      body: CreateKeywordSchema,
      response: {
        201: QuizModel.createKeywordResult,
        400: QuizModel.validationError,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "create"),
    },
  )
  .patch(
    "/keywords/:id",
    async ({ params, body, set, log, locale }) => {
      const keywordId = BigInt(params.id);
      const keyword = await QuestionKeywordService.updateKeyword(
        keywordId,
        body,
        log,
      );
      return successResponse(
        set,
        keyword,
        { key: "quiz.keywordUpdateSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      params: KeywordParamSchema,
      body: UpdateKeywordSchema,
      response: {
        200: QuizModel.updateKeywordResult,
        400: QuizModel.validationError,
        404: QuizModel.error,
        500: QuizModel.error,
      },
      beforeHandle: hasPermission(FEATURE_NAME, "update"),
    },
  )
  .delete(
    "/keywords/:id",
    async ({ params, set, log, locale }) => {
      const keywordId = BigInt(params.id);
      const result = await QuestionKeywordService.deleteKeyword(keywordId, log);
      return successResponse(
        set,
        result,
        { key: "quiz.keywordDeleteSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      params: KeywordParamSchema,
      response: {
        200: QuizModel.deleteKeywordResult,
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

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(
        set,
        400,
        "Duplicate order/constraint violation",
        null,
        locale,
      );
    }

    if (error instanceof InvalidTimeRangeError) {
      return errorResponse(set, 400, error.message, null, locale);
    }

    if (error instanceof CannotDeleteQuestionError) {
      return errorResponse(set, 400, error.message, null, locale);
    }

    return errorResponse(
      set,
      500,
      { key: "common.internalServerError" },
      null,
      locale,
    );
  });

export const quizzes = createBaseApp({ tags: ["Quizzes"] }).use(
  protectedQuizzes,
);
