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

describe("GET /quizzes", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should return quizzes for a material with nested level and material info", async () => {
    const role = await createTestRoleWithPermissions("QuizReaderRole", [
      { featureName: "quiz_management", action: "read" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    // Seed a quiz directly under the material with a nested quiz level
    await prisma.quiz.create({
      data: {
        materialId: material.id, // Updated relationship
        title: "Quiz 1",
        description: "Test quiz",
        isPublished: true,
        levels: {
          create: {
            title: "Level 1",
            levelOrder: 1,
          },
        },
      },
    });

    const res = await app.handle(
      new Request(
        // Updated query parameter to focus on the parent material
        `http://localhost/quizzes?materialId=${material.id.toString()}`,
        {
          method: "GET",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
        },
      ),
    );

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].title).toBe("Quiz 1");
    expect(json.data[0].material).toBe(material.title);
  });

  it("should return empty list when no quizzes exist", async () => {
    const role = await createTestRoleWithPermissions("QuizReaderRole", [
      { featureName: "quiz_management", action: "read" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    const res = await app.handle(
      new Request(
        // Updated query parameter
        `http://localhost/quizzes?materialId=${material.id.toString()}`,
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
    expect(json.data).toEqual([]);
  });

  it("should return 401 without authentication", async () => {
    const role = await createTestRoleWithPermissions("QuizReaderRole", [
      { featureName: "quiz_management", action: "read" },
    ]);
    const { user } = await createAuthenticatedUser({ roleId: role.id });

    const material = await createTestMaterial(user.id);

    const res = await app.handle(
      new Request(
        // Updated query parameter
        `http://localhost/quizzes?materialId=${material.id.toString()}`,
        {
          method: "GET",
        },
      ),
    );

    expect(res.status).toBe(401);
  });

  it("should return 403 if user lacks 'read' permission", async () => {
    const role = await createTestRoleWithPermissions("NoQuizPermsRole", []);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    const res = await app.handle(
      new Request(
        // Updated query parameter to materialId
        `http://localhost/quizzes?materialId=${material.id.toString()}`,
        {
          method: "GET",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
        },
      ),
    );

    expect(res.status).toBe(403);
  });
});
