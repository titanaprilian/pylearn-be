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
  maxScore: z.number(),
  questionOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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
