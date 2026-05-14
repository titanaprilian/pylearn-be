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

describe("GET /materials/:id/levels/:levelId/quizzes/:quizId", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should return quiz details", async () => {
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

    const quiz = await prisma.quiz.create({
      data: {
        materialLevelId: level.id,
        title: "Test Quiz",
        description: "Test description",
        isPublished: true,
      },
    });

    const res = await app.handle(
      new Request(
        `http://localhost/materials/${material.id}/levels/${level.id}/quizzes/${quiz.id}`,
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
    expect(json.data.title).toBe("Test Quiz");
    expect(json.data.level).toBe("Level 1");
    expect(json.data.material).toBe(material.title);
  });

  it("should return 404 for non-existent quiz", async () => {
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
        `http://localhost/materials/${material.id}/levels/${level.id}/quizzes/999999`,
        {
          method: "GET",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
        },
      ),
    );

    expect(res.status).toBe(404);
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

    const quiz = await prisma.quiz.create({
      data: {
        materialLevelId: level.id,
        title: "Test Quiz",
      },
    });

    const res = await app.handle(
      new Request(
        `http://localhost/materials/${material.id}/levels/${level.id}/quizzes/${quiz.id}`,
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
