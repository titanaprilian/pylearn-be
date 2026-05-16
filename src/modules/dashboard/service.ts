import { prisma } from "@/libs/prisma";
import type { Logger } from "pino";
import type { DashboardData } from "./model";

export abstract class DashboardService {
  static async getDashboard(log: Logger): Promise<DashboardData> {
    log.debug("Fetching dashboard data");

    const [
      totalUsers,
      activeUsers,
      totalRoles,
      totalFeatures,
      userDistribution,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.role.count(),
      prisma.feature.count(),
      prisma.role.findMany({
        select: {
          name: true,
          _count: {
            select: { users: true },
          },
        },
      }),
    ]);

    const inactiveUsers = totalUsers - activeUsers;

    const roleDistribution = userDistribution.map((role) => ({
      roleName: role.name,
      count: role._count.users,
    }));

    log.info(
      {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalRoles,
        totalFeatures,
        roleCount: roleDistribution.length,
      },
      "Dashboard data retrieved successfully",
    );

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalRoles,
      totalFeatures,
      userDistribution: roleDistribution,
    };
  }

  static async getLecturerDashboard(log: Logger) {
    log.debug("Fetching global lecturer dashboard data");

    // 1. Fetch top-level global stats and detailed breakdowns concurrently without lecturerId limits
    const [totalMaterials, totalQuizzes, totalAttemptsCount, materialsData] =
      await Promise.all([
        prisma.material.count(), // Global materials count
        prisma.quiz.count(), // Global quizzes count
        prisma.quizAttempt.count(), // ✅ Global attempts calculated directly at database level for maximum speed
        prisma.material.findMany({
          select: {
            id: true,
            title: true,
            materialType: true,
            quizzes: {
              select: {
                id: true,
                levels: {
                  select: {
                    id: true,
                  },
                },
                QuizAttempt: {
                  select: {
                    studentId: true, // Used to compute unique student engagement count per material
                  },
                },
              },
            },
          },
        }),
      ]);

    // 2. Map and aggregate metrics down per material
    const materialBreakdown = materialsData.map((material) => {
      let quizLevelCount = 0;
      const uniqueStudentsSet = new Set<string>();

      material.quizzes.forEach((quiz) => {
        quizLevelCount += quiz.levels.length;

        // Collate unique student IDs who have tried this material's quizzes
        quiz.QuizAttempt.forEach((attempt) => {
          uniqueStudentsSet.add(attempt.studentId);
        });
      });

      return {
        materialId: material.id.toString(),
        title: material.title,
        materialType: material.materialType,
        quizCount: material.quizzes.length,
        levelCount: quizLevelCount,
        uniqueStudentsEngaged: uniqueStudentsSet.size,
      };
    });

    log.info(
      { totalMaterials, totalQuizzes, totalAttemptsCount },
      "Global lecturer dashboard data compiled successfully",
    );

    return {
      overview: {
        totalMaterials,
        totalQuizzes,
        totalStudentAttempts: totalAttemptsCount,
      },
      materialBreakdown,
    };
  }

  static async getStudentDashboard(studentId: string, log: Logger) {
    log.debug({ studentId }, "Fetching student progression dashboard data");

    // 1. Grab all historical attempts with corresponding top-level information
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId },
      include: {
        quiz: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Process metrics via array loops
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter((a) => a.submittedAt !== null);
    const inProgressAttempts = attempts.filter((a) => a.submittedAt === null);

    log.info(
      {
        studentId,
        totalAttempts,
        completed: completedAttempts.length,
      },
      "Student dashboard metrics processed successfully",
    );

    return {
      overview: {
        totalAttempts,
        quizzesCompleted: completedAttempts.length,
      },
      inProgress: inProgressAttempts.map((a) => ({
        attemptId: a.id.toString(),
        quizId: a.quizId.toString(),
        quizTitle: a.quiz.title,
        startedAt: a.createdAt.toISOString(),
      })),
      recentResults: completedAttempts.slice(0, 5).map((a) => ({
        attemptId: a.id.toString(),
        quizId: a.quizId.toString(),
        quizTitle: a.quiz.title,
        submittedAt: a.submittedAt!.toISOString(),
      })),
    };
  }
}
