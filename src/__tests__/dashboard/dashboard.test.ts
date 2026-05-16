import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { app } from "@/server";
import { prisma } from "@/libs/prisma";
import {
  createAuthenticatedUser,
  createTestRoleWithPermissions,
  createTestFeature,
  randomIp,
  resetDatabase,
} from "../test_utils";

describe("GET /dashboard", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should return 401 if not logged in", async () => {
    const res = await app.handle(
      new Request("http://localhost/dashboard", {
        headers: { "x-forwarded-for": randomIp() },
      }),
    );

    expect(res.status).toBe(401);
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await app.handle(
      new Request("http://localhost/dashboard", {
        headers: {
          Authorization: "Bearer invalid-token",
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(res.status).toBe(401);
  });

  it("should return dashboard data for authenticated user", async () => {
    const { authHeaders } = await createAuthenticatedUser();

    const res = await app.handle(
      new Request("http://localhost/dashboard", {
        headers: authHeaders,
      }),
    );

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toHaveProperty("totalUsers");
    expect(json.data).toHaveProperty("activeUsers");
    expect(json.data).toHaveProperty("inactiveUsers");
    expect(json.data).toHaveProperty("totalRoles");
    expect(json.data).toHaveProperty("totalFeatures");
    expect(json.data).toHaveProperty("userDistribution");
    expect(Array.isArray(json.data.userDistribution)).toBe(true);
  });

  it("should return correct counts when data exists", async () => {
    const { authHeaders } = await createAuthenticatedUser();

    await createTestFeature("user_management");
    await createTestFeature("order_management");

    await createTestRoleWithPermissions("AdminRole", [
      { featureName: "user_management", action: "read" },
    ]);
    await createTestRoleWithPermissions("StaffRole", [
      { featureName: "order_management", action: "read" },
    ]);

    await prisma.user.createMany({
      data: [
        {
          email: "admin@test.com",
          password: "hashed",
          name: "Admin User",
          isActive: true,
          roleId: (
            await prisma.role.findUnique({ where: { name: "AdminRole" } })
          )?.id as string,
        },
        {
          email: "staff@test.com",
          password: "hashed",
          name: "Staff User",
          isActive: true,
          roleId: (
            await prisma.role.findUnique({ where: { name: "StaffRole" } })
          )?.id as string,
        },
        {
          email: "inactive@test.com",
          password: "hashed",
          name: "Inactive User",
          isActive: false,
          roleId: (
            await prisma.role.findUnique({ where: { name: "StaffRole" } })
          )?.id as string,
        },
      ],
    });

    const res = await app.handle(
      new Request("http://localhost/dashboard", {
        headers: authHeaders,
      }),
    );

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.totalUsers).toBeGreaterThanOrEqual(4);
    expect(json.data.activeUsers).toBe(3);
    expect(json.data.inactiveUsers).toBe(1);
    expect(json.data.totalRoles).toBeGreaterThanOrEqual(3);
    expect(json.data.totalFeatures).toBeGreaterThanOrEqual(2);
    expect(json.data.userDistribution.length).toBeGreaterThan(0);
  });
});

describe("GET /dashboard/dosen", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should aggregate data correctly for a lecturer", async () => {
    const role = await createTestRoleWithPermissions("LecturerRole", [
      { featureName: "dashboard_management", action: "read" },
    ]);
    const roleMahasiswa = await createTestRoleWithPermissions("MahasiswaRole", [
      { featureName: "dashboard_management", action: "read" },
    ]);

    const { user: lecturer, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const student = await prisma.user.create({
      data: {
        email: "student@test.com",
        password: "hashed_password",
        name: "Test Student",
        roleId: roleMahasiswa.id,
        isActive: true,
      },
    });

    const material = await prisma.material.create({
      data: {
        title: "Architecture Patterns",
        materialType: "text",
        lecturerId: lecturer.id,
      },
    });

    const quiz = await prisma.quiz.create({
      data: {
        materialId: material.id,
        title: "System Design Quiz",
        isPublished: true,
      },
    });

    // Add 2 levels under the quiz
    await prisma.quizLevel.createMany({
      data: [
        { quizId: quiz.id, title: "Level 1 Basics", levelOrder: 1 },
        { quizId: quiz.id, title: "Level 2 Advanced", levelOrder: 2 },
      ],
    });

    // Add 1 quiz attempt from the student
    await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: student.id,
        submittedAt: new Date(),
      },
    });

    // 3. Fire request to the handler
    const res = await app.handle(
      new Request("http://localhost/dashboard/dosen", {
        method: "GET",
        headers: authHeaders,
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();

    // 4. Assert calculated counters match exactly
    expect(json.data.overview.totalMaterials).toBe(1);
    expect(json.data.overview.totalQuizzes).toBe(1);
    expect(json.data.overview.totalStudentAttempts).toBe(1);

    expect(json.data.materialBreakdown).toHaveLength(1);
    expect(json.data.materialBreakdown[0].title).toBe("Architecture Patterns");
    expect(json.data.materialBreakdown[0].quizCount).toBe(1);
    expect(json.data.materialBreakdown[0].levelCount).toBe(2);
    expect(json.data.materialBreakdown[0].uniqueStudentsEngaged).toBe(1);
  });
});

describe("GET /dashboard/mahasiswa", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should process and categorize unsubmitted vs submitted quiz history", async () => {
    const role = await createTestRoleWithPermissions("StudentRole", [
      { featureName: "dashboard_management", action: "read" },
    ]);
    const { user: student, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    // Create a generic material & quizzes to reference
    const material = await prisma.material.create({
      data: {
        title: "Calculus",
        materialType: "video",
        lecturerId: student.id, // Re-using user for material dependency requirements
      },
    });

    const quiz1 = await prisma.quiz.create({
      data: { materialId: material.id, title: "Quiz 1", isPublished: true },
    });
    const quiz2 = await prisma.quiz.create({
      data: { materialId: material.id, title: "Quiz 2", isPublished: true },
    });

    // 2. Create 1 completed attempt and 1 in-progress attempt
    await prisma.quizAttempt.create({
      data: {
        quizId: quiz1.id,
        studentId: student.id,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        submittedAt: new Date("2026-01-01T01:00:00.000Z"),
      },
    });

    await prisma.quizAttempt.create({
      data: {
        quizId: quiz2.id,
        studentId: student.id,
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
        submittedAt: null, // Active execution item
      },
    });

    // 3. Fire request to handler
    const res = await app.handle(
      new Request("http://localhost/dashboard/mahasiswa", {
        method: "GET",
        headers: authHeaders,
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();

    // 4. Assert separate arrays map out into logical components cleanly
    expect(json.data.overview.totalAttempts).toBe(2);
    expect(json.data.overview.quizzesCompleted).toBe(1);

    // Verify in-progress block parsing targets
    expect(json.data.inProgress).toHaveLength(1);
    expect(json.data.inProgress[0].quizTitle).toBe("Quiz 2");
    expect(json.data.inProgress[0].startedAt).toBeDefined();

    // Verify historic result lists parse correctly
    expect(json.data.recentResults).toHaveLength(1);
    expect(json.data.recentResults[0].quizTitle).toBe("Quiz 1");
    expect(json.data.recentResults[0].submittedAt).toBeDefined();
  });
});
