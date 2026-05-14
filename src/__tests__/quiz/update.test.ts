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

describe("PATCH /quizzes/:id", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should update a quiz", async () => {
    const role = await createTestRoleWithPermissions("QuizUpdaterRole", [
      { featureName: "quiz_management", action: "update" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    // Updated: Seed directly under materialId
    const quiz = await prisma.quiz.create({
      data: {
        materialId: material.id,
        title: "Original Title",
        isPublished: false,
      },
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({ title: "Updated Title", isPublished: true }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.title).toBe("Updated Title");
    expect(json.data.isPublished).toBe(true);
  });

  it("should update quiz with new timing constraints", async () => {
    const role = await createTestRoleWithPermissions("QuizUpdaterRole", [
      { featureName: "quiz_management", action: "update" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    // Updated: Seed directly under materialId
    const quiz = await prisma.quiz.create({
      data: {
        materialId: material.id,
        title: "Test Quiz",
        startTime: new Date("2025-01-01T00:00:00Z"),
        endTime: new Date("2025-01-02T00:00:00Z"),
      },
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          startTime: "2025-01-03T00:00:00Z",
          endTime: "2025-01-04T00:00:00Z",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.startTime).toBe("2025-01-03T00:00:00.000Z");
    expect(json.data.endTime).toBe("2025-01-04T00:00:00.000Z");
  });

  it("should reject invalid startTime/endTime on update", async () => {
    const role = await createTestRoleWithPermissions("QuizUpdaterRole", [
      { featureName: "quiz_management", action: "update" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    // Updated: Seed directly under materialId
    const quiz = await prisma.quiz.create({
      data: {
        materialId: material.id,
        title: "Test Quiz",
        startTime: new Date("2025-01-01T00:00:00Z"),
        endTime: new Date("2025-01-02T00:00:00Z"),
      },
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          startTime: "2025-01-05T00:00:00Z",
          endTime: "2025-01-01T00:00:00Z",
        }),
      }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe("Start time must be before end time");
  });

  it("should return 404 for non-existent quiz", async () => {
    const role = await createTestRoleWithPermissions("QuizUpdaterRole", [
      { featureName: "quiz_management", action: "update" },
    ]);
    const { authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/999999`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({ title: "Updated Title" }),
      }),
    );

    expect(res.status).toBe(404);
  });

  it("should return 403 if user lacks 'update' permission", async () => {
    const role = await createTestRoleWithPermissions("QuizReaderRole", [
      { featureName: "quiz_management", action: "read" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    // Updated: Seed directly under materialId
    const quiz = await prisma.quiz.create({
      data: {
        materialId: material.id,
        title: "Test Quiz",
      },
    });

    const res = await app.handle(
      new Request(`http://localhost/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({ title: "Updated Title" }),
      }),
    );

    expect(res.status).toBe(403);
  });
});
