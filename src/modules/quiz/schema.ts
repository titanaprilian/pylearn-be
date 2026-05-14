import { z } from "zod";

export const CreateQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  isPublished: z.boolean().optional(),
});

export const UpdateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  isPublished: z.boolean().optional(),
});

export const QuizListParamSchema = z.object({
  id: z.string(),
  levelId: z.string(),
});

export const QuizParamSchema = z.object({
  id: z.string(),
  levelId: z.string(),
  quizId: z.string(),
});

export const CreateQuizQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  answerText: z.string().min(1, "Answer text is required"),
  maxScore: z.number().int().min(0).optional().default(100),
});

export const UpdateQuizQuestionSchema = z.object({
  questionText: z.string().min(1).optional(),
  answerText: z.string().min(1).optional(),
  maxScore: z.number().int().min(0).optional(),
});

export const QuestionParamSchema = z.object({
  id: z.string(),
  levelId: z.string(),
  quizId: z.string(),
  questionId: z.string(),
});

export const KeywordParamSchema = z.object({
  id: z.string(),
  levelId: z.string(),
  quizId: z.string(),
  questionId: z.string(),
  keywordId: z.string(),
});

export const KeywordListParamSchema = z.object({
  id: z.string(),
  levelId: z.string(),
  quizId: z.string(),
  questionId: z.string(),
});

export const CreateKeywordSchema = z.object({
  blankOrder: z.number().int().min(0, "Blank order must be non-negative"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
});

export const UpdateKeywordSchema = z.object({
  blankOrder: z.number().int().min(0).optional(),
  correctAnswer: z.string().min(1).optional(),
});

export type CreateQuizInput = z.infer<typeof CreateQuizSchema>;
export type UpdateQuizInput = z.infer<typeof UpdateQuizSchema>;
export type CreateQuizQuestionInput = z.infer<typeof CreateQuizQuestionSchema>;
export type UpdateQuizQuestionInput = z.infer<typeof UpdateQuizQuestionSchema>;
export type CreateKeywordInput = z.infer<typeof CreateKeywordSchema>;
export type UpdateKeywordInput = z.infer<typeof UpdateKeywordSchema>;
