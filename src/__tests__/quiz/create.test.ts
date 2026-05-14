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

describe("POST /materials/:id/levels/:levelId/quizzes", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should create a quiz", async () => {
    const role = await createTestRoleWithPermissions("QuizCreatorRole", [
      { featureName: "quiz_management", action: "create" },
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
        `http://localhost/materials/${material.id}/levels/${level.id}/quizzes`,
        {
          method: "POST",
          headers: {
            ...authHeaders,
            "content-type": "application/json",
            "x-forwarded-for": randomIp(),
          },
          body: JSON.stringify({
            title: "New Quiz",
            description: "Test description",
          }),
        },
      ),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.title).toBe("New Quiz");
    expect(json.data.description).toBe("Test description");
  });

  it("should create quiz with timing constraints", async () => {
    const role = await createTestRoleWithPermissions("QuizCreatorRole", [
      { featureName: "quiz_management", action: "create" },
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
        `http://localhost/materials/${material.id}/levels/${level.id}/quizzes`,
        {
          method: "POST",
          headers: {
            ...authHeaders,
            "content-type": "application/json",
            "x-forwarded-for": randomIp(),
          },
          body: JSON.stringify({
            title: "Timed Quiz",
            startTime: "2025-01-01T00:00:00Z",
            endTime: "2025-01-02T00:00:00Z",
            isPublished: true,
          }),
        },
      ),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.startTime).toBe("2025-01-01T00:00:00.000Z");
    expect(json.data.endTime).toBe("2025-01-02T00:00:00.000Z");
    expect(json.data.isPublished).toBe(true);
  });

  it("should reject invalid startTime/endTime (startTime >= endTime)", async () => {
    const role = await createTestRoleWithPermissions("QuizCreatorRole", [
      { featureName: "quiz_management", action: "create" },
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
        `http://localhost/materials/${material.id}/levels/${level.id}/quizzes`,
        {
          method: "POST",
          headers: {
            ...authHeaders,
            "content-type": "application/json",
            "x-forwarded-for": randomIp(),
          },
          body: JSON.stringify({
            title: "Invalid Quiz",
            startTime: "2025-01-02T00:00:00Z",
            endTime: "2025-01-01T00:00:00Z",
          }),
        },
      ),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe("startTime must be before endTime");
  });

  it("should reject when user lacks create permission", async () => {
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
        `http://localhost/materials/${material.id}/levels/${level.id}/quizzes`,
        {
          method: "POST",
          headers: {
            ...authHeaders,
            "content-type": "application/json",
            "x-forwarded-for": randomIp(),
          },
          body: JSON.stringify({ title: "Test Quiz" }),
        },
      ),
    );

    expect(res.status).toBe(403);
  });
});
