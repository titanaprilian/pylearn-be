import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "@/server";
import { prisma } from "@/libs/prisma";

import {
  resetDatabase,
  createAuthenticatedUser,
  createTestMaterial,
  createTestRoleWithPermissions,
  randomIp,
} from "../test_utils";

// =========================================
// Helpers
// =========================================

async function createMockQuiz(userId: string) {
  const material = await createTestMaterial(userId);

  return await prisma.quiz.create({
    data: {
      materialId: material.id,
      title: "Attempt Quiz",
      isPublished: true,
    },
  });
}

// =========================================
// POST /quizzes/attempts
// =========================================

describe("POST /quizzes/attempts", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should create quiz attempt", async () => {
    const role = await createTestRoleWithPermissions("AttemptCreatorRole", [
      {
        featureName: "quiz_management",
        action: "create",
      },
    ]);

    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    const res = await app.handle(
      new Request("http://localhost/quizzes/attempts", {
        method: "POST",

        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },

        body: JSON.stringify({
          quizId: quiz.id.toString(),
        }),
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data.quizId).toBe(quiz.id.toString());
    expect(json.data.studentId).toBe(user.id);
  });

  it("should reject without permission", async () => {
    const role = await createTestRoleWithPermissions("AttemptReaderRole", [
      {
        featureName: "quiz_management",
        action: "read",
      },
    ]);

    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    const res = await app.handle(
      new Request("http://localhost/quizzes/attempts", {
        method: "POST",

        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },

        body: JSON.stringify({
          quizId: quiz.id.toString(),
        }),
      }),
    );

    expect(res.status).toBe(403);
  });
});

// =========================================
// GET /quizzes/attempts
// =========================================

describe("GET /quizzes/attempts", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should return attempts", async () => {
    const role = await createTestRoleWithPermissions("AttemptReaderRole", [
      {
        featureName: "quiz_management",
        action: "read",
      },
    ]);

    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: user.id,
      },
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/attempts?quizId=${quiz.id}`, {
        method: "GET",

        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(res.status).toBe(200);

    const json = await res.json();

    expect(json.data).toHaveLength(1);

    expect(json.data[0].quizId).toBe(quiz.id.toString());
  });
});

// =========================================
// GET /quizzes/attempts/:id
// =========================================

describe("GET /quizzes/attempts/:id", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should return attempt detail", async () => {
    const role = await createTestRoleWithPermissions("AttemptReaderRole", [
      {
        featureName: "quiz_management",
        action: "read",
      },
    ]);

    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: user.id,
      },
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/attempts/${attempt.id}`, {
        method: "GET",

        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(res.status).toBe(200);

    const json = await res.json();

    expect(json.data.id).toBe(attempt.id.toString());

    expect(json.data.quizId).toBe(quiz.id.toString());
  });

  it("should return 404 for non-existent attempt", async () => {
    const role = await createTestRoleWithPermissions("AttemptReaderRole", [
      {
        featureName: "quiz_management",
        action: "read",
      },
    ]);

    const { authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const res = await app.handle(
      new Request("http://localhost/quizzes/attempts/999999", {
        method: "GET",

        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(res.status).toBe(404);
  });
});

// =========================================
// PATCH /quizzes/attempts/:id/submit
// =========================================

describe("PATCH /quizzes/attempts/:id/submit", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should submit attempt", async () => {
    const role = await createTestRoleWithPermissions("AttemptUpdaterRole", [
      {
        featureName: "quiz_management",
        action: "update",
      },
    ]);

    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: user.id,
      },
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/attempts/${attempt.id}/submit`, {
        method: "PATCH",

        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(res.status).toBe(200);

    const json = await res.json();

    expect(json.data.submittedAt).not.toBeNull();
  });
});

// =========================================
// GET /quizzes/attempts/status/me
// =========================================
describe.only("GET /quizzes/attempts/status/me", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should return levels with NOT_STARTED status when no answers or attempts exist", async () => {
    const role = await createTestRoleWithPermissions("StatusReaderRole", [
      {
        featureName: "quiz_management",
        action: "read",
      },
    ]);

    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    // Create a mock level to verify tracking array properties
    const level = await prisma.quizLevel.create({
      data: {
        quizId: quiz.id,
        title: "Introduction Level",
        levelOrder: 1,
      },
    });

    await prisma.quizQuestion.create({
      data: {
        quizLevelId: level.id,
        questionText: "Sample Question?",
        answerText: "Answer",
        maxScore: 10,
        questionOrder: 1,
      },
    });

    const res = await app.handle(
      new Request(
        `http://localhost/quizzes/attempts/status/me?quizId=${quiz.id}`,
        {
          method: "GET",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
        },
      ),
    );

    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data.quizId).toBe(quiz.id.toString());
    expect(json.data.levels).toHaveLength(1);
    expect(json.data.levels[0].levelId).toBe(level.id.toString());
    expect(json.data.levels[0].status).toBe("NOT_STARTED");
    expect(json.data.levels[0].currentAttemptId).toBeNull();
    expect(json.data.levels[0].totalQuestions).toBe(1);
    expect(json.data.attemptHistory).toHaveLength(0);
  });

  it("should return IN_PROGRESS status when answers exist but the parent attempt is active", async () => {
    const role = await createTestRoleWithPermissions("StatusReaderRole", [
      {
        featureName: "quiz_management",
        action: "read",
      },
    ]);

    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    const level = await prisma.quizLevel.create({
      data: {
        quizId: quiz.id,
        title: "Intermediate Level",
        levelOrder: 2,
      },
    });

    const question = await prisma.quizQuestion.create({
      data: {
        quizLevelId: level.id,
        questionText: "What is Bun?",
        answerText: "A fast runtime",
        maxScore: 10,
        questionOrder: 1,
      },
    });

    // Create an active attempt (submittedAt is null)
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: user.id,
        submittedAt: null,
      },
    });

    // Connect an answer record to bind execution tracing inside this level context
    await prisma.quizAnswer.create({
      data: {
        quizAttemptId: attempt.id,
        quizQuestionId: question.id,
        answerText: "A fast runtime",
        isCorrect: true,
      },
    });

    const res = await app.handle(
      new Request(
        `http://localhost/quizzes/attempts/status/me?quizId=${quiz.id}`,
        {
          method: "GET",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
        },
      ),
    );

    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data.levels[0].status).toBe("IN_PROGRESS");
    expect(json.data.levels[0].currentAttemptId).toBe(attempt.id.toString());
    expect(json.data.attemptHistory).toHaveLength(1);
    expect(json.data.attemptHistory[0].id).toBe(attempt.id.toString());
    expect(json.data.attemptHistory[0].submittedAt).toBeNull();
  });

  it("should return COMPLETED status when answers exist and the parent attempt is finalized", async () => {
    const role = await createTestRoleWithPermissions("StatusReaderRole", [
      {
        featureName: "quiz_management",
        action: "read",
      },
    ]);

    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    const level = await prisma.quizLevel.create({
      data: {
        quizId: quiz.id,
        title: "Advanced Mastery",
        levelOrder: 3,
      },
    });

    const question = await prisma.quizQuestion.create({
      data: {
        quizLevelId: level.id,
        questionText: "What is Elysia?",
        answerText: "A web framework",
        maxScore: 10,
        questionOrder: 1,
      },
    });

    // Create a finished attempt (submittedAt has a timestamp value)
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: user.id,
        submittedAt: new Date(),
      },
    });

    // Seed answer reference link
    await prisma.quizAnswer.create({
      data: {
        quizAttemptId: attempt.id,
        quizQuestionId: question.id,
        answerText: "A web framework",
        isCorrect: true,
      },
    });

    const res = await app.handle(
      new Request(
        `http://localhost/quizzes/attempts/status/me?quizId=${quiz.id}`,
        {
          method: "GET",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
        },
      ),
    );

    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data.levels[0].status).toBe("COMPLETED");
    expect(json.data.levels[0].currentAttemptId).toBe(attempt.id.toString());
    expect(json.data.attemptHistory).toHaveLength(1);
    expect(json.data.attemptHistory[0].submittedAt).not.toBeNull();
  });

  it("should return 400 Bad Request if quizId query parameter is missing", async () => {
    const role = await createTestRoleWithPermissions("StatusReaderRole", [
      {
        featureName: "quiz_management",
        action: "read",
      },
    ]);

    const { authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const res = await app.handle(
      new Request("http://localhost/quizzes/attempts/status/me", {
        method: "GET",
        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(res.status).toBe(400);
  });
});
