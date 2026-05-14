import { z } from "zod";
import { createErrorSchema, createResponseSchema } from "@/libs/response";

export const QuizSafe = z.object({
  id: z.string(),
  materialLevelId: z.string(),
  materialId: z.string(),
  level: z.string(),
  material: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startTime: z.string().datetime().nullable(),
  endTime: z.string().datetime().nullable(),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const QuizCreateSafe = z.object({
  id: z.string(),
  materialLevelId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startTime: z.string().datetime().nullable(),
  endTime: z.string().datetime().nullable(),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const QuizDeleteSafe = z.object({
  id: z.string(),
});

export const QuizQuestionSafe = z.object({
  id: z.string(),
  quizId: z.string(),
  quizTitle: z.string().optional(),
  questionText: z.string(),
  answerText: z.string(),
  maxScore: z.number(),
  questionOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const QuestionKeywordSafe = z.object({
  id: z.string(),
  questionId: z.string(),
  quizId: z.string().optional(),
  quizTitle: z.string().optional(),
  blankOrder: z.number(),
  correctAnswer: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const GroupedQuestion = z.object({
  id: z.string(),
  questionText: z.string(),
  maxScore: z.number(),
  questionOrder: z.number(),
});

export const GroupedQuiz = z.object({
  quizId: z.string(),
  quizTitle: z.string(),
  questions: z.array(GroupedQuestion),
});

export const GroupedMaterialLevel = z.object({
  levelId: z.string(),
  levelTitle: z.string(),
  quizzes: z.array(GroupedQuiz),
});

export const QuizModel = {
  quiz: createResponseSchema(QuizSafe),
  quizzes: createResponseSchema(z.array(QuizSafe)),
  createResult: createResponseSchema(QuizCreateSafe),
  updateResult: createResponseSchema(QuizCreateSafe),
  deleteResult: createResponseSchema(QuizDeleteSafe),

  question: createResponseSchema(QuizQuestionSafe),
  questions: createResponseSchema(z.array(QuizQuestionSafe)),
  createQuestionResult: createResponseSchema(QuizQuestionSafe),
  updateQuestionResult: createResponseSchema(QuizQuestionSafe),
  deleteQuestionResult: createResponseSchema(QuizDeleteSafe),

  keyword: createResponseSchema(QuestionKeywordSafe),
  keywords: createResponseSchema(z.array(QuestionKeywordSafe)),
  createKeywordResult: createResponseSchema(QuestionKeywordSafe),
  updateKeywordResult: createResponseSchema(QuestionKeywordSafe),
  deleteKeywordResult: createResponseSchema(QuizDeleteSafe),

  groupedQuestions: createResponseSchema(z.array(GroupedMaterialLevel)),

  error: createErrorSchema(z.null()),
  validationError: createErrorSchema(
    z.array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    ),
  ),
} as const;

export type QuizModelType = {
  quiz: z.infer<typeof QuizModel.quiz>;
  quizzes: z.infer<typeof QuizModel.quizzes>;
  createResult: z.infer<typeof QuizModel.createResult>;
  updateResult: z.infer<typeof QuizModel.updateResult>;
  deleteResult: z.infer<typeof QuizModel.deleteResult>;
  question: z.infer<typeof QuizModel.question>;
  questions: z.infer<typeof QuizModel.questions>;
  createQuestionResult: z.infer<typeof QuizModel.createQuestionResult>;
  updateQuestionResult: z.infer<typeof QuizModel.updateQuestionResult>;
  deleteQuestionResult: z.infer<typeof QuizModel.deleteQuestionResult>;
};
