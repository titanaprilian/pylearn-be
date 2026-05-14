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

// Helper function to create a test quiz since levels require a parent quiz
async function createMockQuiz(userId: string) {
  const material = await createTestMaterial(userId);
  return await prisma.quiz.create({
    data: {
      materialId: material.id,
      title: "Base Test Quiz",
      isPublished: true,
    },
  });
}

// =========================================================================
// POST /quizzes/levels (Create)
// =========================================================================
describe("POST /quizzes/levels", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should create a quiz level", async () => {
    const role = await createTestRoleWithPermissions("QuizLevelCreatorRole", [
      { featureName: "quiz_management", action: "create" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    const res = await app.handle(
      new Request(`http://localhost/quizzes/levels`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          quizId: quiz.id.toString(),
          title: "Beginner Level",
          levelOrder: 1,
        }),
      }),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.title).toBe("Beginner Level");
    expect(json.data.levelOrder).toBe(1);
    expect(json.data.quizId).toBe(quiz.id.toString());
  });

  it("should reject when user lacks create permission", async () => {
    const role = await createTestRoleWithPermissions("QuizLevelReaderRole", [
      { featureName: "quiz_management", action: "read" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    const res = await app.handle(
      new Request(`http://localhost/quizzes/levels`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          quizId: quiz.id.toString(),
          title: "Unauthorized Level",
          levelOrder: 1,
        }),
      }),
    );

    expect(res.status).toBe(403);
  });
});

// =========================================================================
// GET /quizzes/levels (List by Query Param)
// =========================================================================
describe("GET /quizzes/levels", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should return levels for a quiz", async () => {
    const role = await createTestRoleWithPermissions("QuizLevelReaderRole", [
      { featureName: "quiz_management", action: "read" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);

    await prisma.quizLevel.create({
      data: { quizId: quiz.id, title: "Level 1", levelOrder: 1 },
    });

    const res = await app.handle(
      new Request(
        `http://localhost/quizzes/levels?quizId=${quiz.id.toString()}`,
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
    expect(json.data).toHaveLength(1);
    expect(json.data[0].title).toBe("Level 1");
    expect(json.data[0].quizId).toBe(quiz.id.toString());
  });
});

// =========================================================================
// GET /quizzes/levels/:id (Details)
// =========================================================================
describe("GET /quizzes/levels/:id", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should return quiz level details", async () => {
    const role = await createTestRoleWithPermissions("QuizLevelReaderRole", [
      { featureName: "quiz_management", action: "read" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);
    const level = await prisma.quizLevel.create({
      data: { quizId: quiz.id, title: "Specific Level", levelOrder: 2 },
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/levels/${level.id}`, {
        method: "GET",
        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.title).toBe("Specific Level");
    expect(json.data.levelOrder).toBe(2);
  });

  it("should return 404 for non-existent quiz level", async () => {
    const role = await createTestRoleWithPermissions("QuizLevelReaderRole", [
      { featureName: "quiz_management", action: "read" },
    ]);
    const { authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/levels/999999`, {
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

// =========================================================================
// PATCH /quizzes/levels/:id (Update)
// =========================================================================
describe("PATCH /quizzes/levels/:id", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should update a quiz level", async () => {
    const role = await createTestRoleWithPermissions("QuizLevelUpdaterRole", [
      { featureName: "quiz_management", action: "update" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);
    const level = await prisma.quizLevel.create({
      data: { quizId: quiz.id, title: "Old Title", levelOrder: 1 },
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/levels/${level.id}`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({ title: "New Title", levelOrder: 3 }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.title).toBe("New Title");
    expect(json.data.levelOrder).toBe(3);
  });
});

// =========================================================================
// DELETE /quizzes/levels/:id (Delete)
// =========================================================================
describe("DELETE /quizzes/levels/:id", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should delete a quiz level", async () => {
    const role = await createTestRoleWithPermissions("QuizLevelDeleterRole", [
      { featureName: "quiz_management", action: "delete" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const quiz = await createMockQuiz(user.id);
    const level = await prisma.quizLevel.create({
      data: { quizId: quiz.id, title: "To Be Deleted", levelOrder: 1 },
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/levels/${level.id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe(level.id.toString());

    const deleted = await prisma.quizLevel.findUnique({
      where: { id: level.id },
    });
    expect(deleted).toBeNull();
  });
});
