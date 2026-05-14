import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { app } from "@/server";
import { prisma } from "@/libs/prisma";
import {
  createAuthenticatedUser,
  resetDatabase,
  randomIp,
  createTestRoleWithPermissions,
  createTestMaterial,
} from "../test_utils";

describe("DELETE /materials/:id", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should delete a material", async () => {
    const role = await createTestRoleWithPermissions("DeleterRole", [
      { featureName: "material_management", action: "delete" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id, {
      title: "Material to delete",
    });

    const response = await app.handle(
      new Request(`http://localhost/materials/${material.id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.title).toBe("Material to delete");

    const deletedMaterial = await prisma.material.findUnique({
      where: { id: material.id },
    });
    expect(deletedMaterial).toBeNull();
  });

  it("should return 404 for non-existent material", async () => {
    const role = await createTestRoleWithPermissions(
      "DeleterRoleForNonExistent",
      [{ featureName: "material_management", action: "delete" }],
    );
    const { authHeaders } = await createAuthenticatedUser({ roleId: role.id });

    const response = await app.handle(
      new Request("http://localhost/materials/999999999", {
        method: "DELETE",
        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(response.status).toBe(404);
  });

  it("should return 401 without authentication", async () => {
    const role = await createTestRoleWithPermissions("DeleterRole", [
      { featureName: "material_management", action: "delete" },
    ]);
    const { user } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id, {
      title: "Test Material",
    });

    const response = await app.handle(
      new Request(`http://localhost/materials/${material.id}`, {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("should return 403 if user lacks 'delete' permission", async () => {
    const role = await createTestRoleWithPermissions("NoPermsRole", []);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    const response = await app.handle(
      new Request(`http://localhost/materials/${material.id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );
    expect(response.status).toBe(403);
  });

  it("should delete material if user has 'delete' permission", async () => {
    const role = await createTestRoleWithPermissions("DeleterRole", [
      { featureName: "material_management", action: "delete" },
    ]);
    const { user, authHeaders } = await createAuthenticatedUser({
      roleId: role.id,
    });

    const material = await createTestMaterial(user.id);

    const response = await app.handle(
      new Request(`http://localhost/materials/${material.id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders,
          "x-forwarded-for": randomIp(),
        },
      }),
    );
    expect(response.status).toBe(200);

    const deletedMaterial = await prisma.material.findUnique({
      where: { id: material.id },
    });
    expect(deletedMaterial).toBeNull();
  });
});
