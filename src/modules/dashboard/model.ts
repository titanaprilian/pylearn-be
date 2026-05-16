import { z } from "zod";
import { createErrorSchema, createResponseSchema } from "@/libs/response";

const RoleDistributionItem = z.object({
  roleName: z.string(),
  count: z.number(),
});

const DashboardData = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  inactiveUsers: z.number(),
  totalRoles: z.number(),
  totalFeatures: z.number(),
  userDistribution: z.array(RoleDistributionItem),
});

const LecturerOverviewSchema = z.object({
  totalMaterials: z.number().int().nonnegative(),
  totalQuizzes: z.number().int().nonnegative(),
  totalStudentAttempts: z.number().int().nonnegative(),
});

const MaterialBreakdownItemSchema = z.object({
  materialId: z.string(),
  title: z.string(),
  materialType: z.string(),
  quizCount: z.number().int().nonnegative(),
  levelCount: z.number().int().nonnegative(),
  uniqueStudentsEngaged: z.number().int().nonnegative(),
});

export const LecturerDashboardSchema = z.object({
  overview: LecturerOverviewSchema,
  materialBreakdown: z.array(MaterialBreakdownItemSchema),
});

const StudentOverviewSchema = z.object({
  totalAttempts: z.number().int().nonnegative(),
  quizzesCompleted: z.number().int().nonnegative(),
});

const InProgressAttemptItemSchema = z.object({
  attemptId: z.string(),
  quizId: z.string(),
  quizTitle: z.string(),
  startedAt: z.string().datetime(),
});

const RecentResultItemSchema = z.object({
  attemptId: z.string(),
  quizId: z.string(),
  quizTitle: z.string(),
  submittedAt: z.string().datetime(),
});

export const StudentDashboardSchema = z.object({
  overview: StudentOverviewSchema,
  inProgress: z.array(InProgressAttemptItemSchema),
  recentResults: z.array(RecentResultItemSchema),
});

export const DashboardModel = {
  dashboard: createResponseSchema(DashboardData),
  lecturerDashboard: createResponseSchema(LecturerDashboardSchema),
  studentDashboard: createResponseSchema(StudentDashboardSchema),
  error: createErrorSchema(z.null()),
};

export type DashboardData = z.infer<typeof DashboardData>;
export type StudentDashboardData = z.infer<typeof StudentDashboardSchema>;
export type LecturerDashboardData = z.infer<typeof LecturerDashboardSchema>;
