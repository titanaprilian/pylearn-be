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

  it("should return quizzes for a level with level and material info", async () => {
    const role = await createTestRoleWithPermissions("QuizReaderRole", [
      { featureName: "quiz_management", action: "read" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);
    const level = await prisma.materialLevel.create({
      data: { materialId: material.id, title: "Level 1", levelOrder: 1 },
    });

    await prisma.quiz.create({
      data: {
        materialLevelId: level.id,
        title: "Quiz 1",
        description: "Test quiz",
        isPublished: true,
      },
    });

    const res = await app.handle(
      new Request(
        // Updated URL: Flattened path using query parameter
        `http://localhost/quizzes?levelId=${level.id.toString()}`,
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
    expect(json.data[0].title).toBe("Quiz 1");
    expect(json.data[0].level).toBe("Level 1");
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
    const level = await prisma.materialLevel.create({
      data: { materialId: material.id, title: "Level 1", levelOrder: 1 },
    });

    const res = await app.handle(
      new Request(
        // Updated URL: Flattened path using query parameter
        `http://localhost/quizzes?levelId=${level.id.toString()}`,
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
    const level = await prisma.materialLevel.create({
      data: { materialId: material.id, title: "Level 1", levelOrder: 1 },
    });

    const res = await app.handle(
      new Request(
        // Updated URL: Flattened path using query parameter
        `http://localhost/quizzes?levelId=${level.id.toString()}`,
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
    const level = await prisma.materialLevel.create({
      data: { materialId: material.id, title: "Level 1", levelOrder: 1 },
    });

    const res = await app.handle(
      new Request(
        // Updated URL: Flattened path using query parameter
        `http://localhost/quizzes?levelId=${level.id.toString()}`,
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
