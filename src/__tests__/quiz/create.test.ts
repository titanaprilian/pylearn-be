import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "@/server";
import {
  resetDatabase,
  createAuthenticatedUser,
  createTestMaterial,
  createTestRoleWithPermissions,
  randomIp,
} from "../test_utils";

describe("POST /quizzes", () => {
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

    // Directly use the material without creating an intermediary material level
    const material = await createTestMaterial(user.id);

    const res = await app.handle(
      new Request(`http://localhost/quizzes`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          materialId: material.id.toString(),
          title: "New Quiz",
          description: "Test description",
        }),
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data.title).toBe("New Quiz");
    expect(json.data.description).toBe("Test description");
    expect(json.data.materialId).toBe(material.id.toString());
  });

  it("should create quiz with timing constraints", async () => {
    const role = await createTestRoleWithPermissions("QuizCreatorRole", [
      { featureName: "quiz_management", action: "create" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    const res = await app.handle(
      new Request(`http://localhost/quizzes`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          materialId: material.id.toString(), // Updated field name
          title: "Timed Quiz",
          startTime: "2025-01-01T00:00:00Z",
          endTime: "2025-01-02T00:00:00Z",
          isPublished: true,
        }),
      }),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.startTime).toBe("2025-01-01T00:00:00.000Z");
    expect(json.data.endTime).toBe("2025-01-02T00:00:00.000Z");
    expect(json.data.isPublished).toBe(true);
  });

  it("should reject when user lacks create permission", async () => {
    const role = await createTestRoleWithPermissions("QuizReaderRole", [
      { featureName: "quiz_management", action: "read" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    const res = await app.handle(
      new Request(`http://localhost/quizzes`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          materialId: material.id.toString(), // Updated field name
          title: "Test Quiz",
        }),
      }),
    );

    expect(res.status).toBe(403);
  });
});
