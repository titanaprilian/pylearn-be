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
