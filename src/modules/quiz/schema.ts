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

export type CreateQuizInput = z.infer<typeof CreateQuizSchema>;
export type UpdateQuizInput = z.infer<typeof UpdateQuizSchema>;
