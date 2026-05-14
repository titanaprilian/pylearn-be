import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { app } from "@/server";
import { prisma } from "@/libs/prisma";
import {
  createAuthenticatedUser,
  createTestRoleWithPermissions,
  resetDatabase,
  randomIp,
} from "../test_utils";

describe("Material Levels CRUD", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /materials/:id/levels", () => {
    it("should create levels with auto-incrementing order", async () => {
      const role = await createTestRoleWithPermissions("CreatorRole", [
        { featureName: "material_management", action: "create" },
        { featureName: "material_management", action: "read" },
      ]);
      const { user, authHeaders } = await createAuthenticatedUser({
        roleId: role.id,
      });

      const material = await prisma.material.create({
        data: {
          lecturerId: user.id,
          title: "Test Material",
          materialType: "text",
        },
      });

      const res1 = await app.handle(
        new Request(`http://localhost/materials/${material.id}/levels`, {
          method: "POST",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
          body: JSON.stringify({ title: "Level 1" }),
        }),
      );
      expect(res1.status).toBe(201);
      const body1 = await res1.json();
      expect(body1.data.levelOrder).toBe(1);

      const res2 = await app.handle(
        new Request(`http://localhost/materials/${material.id}/levels`, {
          method: "POST",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
          body: JSON.stringify({ title: "Level 2" }),
        }),
      );
      expect(res2.status).toBe(201);
      const body2 = await res2.json();
      expect(body2.data.levelOrder).toBe(2);

      const res3 = await app.handle(
        new Request(`http://localhost/materials/${material.id}/levels`, {
          method: "POST",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
          body: JSON.stringify({ title: "Level 3" }),
        }),
      );
      expect(res3.status).toBe(201);
      const body3 = await res3.json();
      expect(body3.data.levelOrder).toBe(3);
    });
  });

  describe("GET /materials/:id/levels", () => {
    it("should list levels ordered by levelOrder ASC", async () => {
      const role = await createTestRoleWithPermissions("ReaderRole", [
        { featureName: "material_management", action: "create" },
        { featureName: "material_management", action: "read" },
      ]);
      const { user, authHeaders } = await createAuthenticatedUser({
        roleId: role.id,
      });

      const material = await prisma.material.create({
        data: {
          lecturerId: user.id,
          title: "Test Material",
          materialType: "text",
        },
      });

      await prisma.materialLevel.createMany({
        data: [
          { materialId: material.id, title: "Third Level", levelOrder: 3 },
          { materialId: material.id, title: "First Level", levelOrder: 1 },
          { materialId: material.id, title: "Second Level", levelOrder: 2 },
        ],
      });

      const res = await app.handle(
        new Request(`http://localhost/materials/${material.id}/levels`, {
          method: "GET",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.length).toBe(3);
      expect(body.data[0].title).toBe("First Level");
      expect(body.data[1].title).toBe("Second Level");
      expect(body.data[2].title).toBe("Third Level");
    });
  });

  describe("PATCH /materials/:id/levels/:levelId", () => {
    it("should update level title", async () => {
      const role = await createTestRoleWithPermissions("UpdaterRole", [
        { featureName: "material_management", action: "create" },
        { featureName: "material_management", action: "read" },
        { featureName: "material_management", action: "update" },
      ]);
      const { user, authHeaders } = await createAuthenticatedUser({
        roleId: role.id,
      });

      const material = await prisma.material.create({
        data: {
          lecturerId: user.id,
          title: "Test Material",
          materialType: "text",
        },
      });

      const level = await prisma.materialLevel.create({
        data: {
          materialId: material.id,
          title: "Original Title",
          levelOrder: 1,
        },
      });

      const res = await app.handle(
        new Request(
          `http://localhost/materials/${material.id}/levels/${level.id}`,
          {
            method: "PATCH",
            headers: {
              ...authHeaders,
              "x-forwarded-for": randomIp(),
            },
            body: JSON.stringify({ title: "Updated Title" }),
          },
        ),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.title).toBe("Updated Title");
    });
  });

  describe("DELETE /materials/:id/levels/:levelId", () => {
    it("should delete the highest level", async () => {
      const role = await createTestRoleWithPermissions("DeleterRole", [
        { featureName: "material_management", action: "create" },
        { featureName: "material_management", action: "read" },
        { featureName: "material_management", action: "delete" },
      ]);
      const { user, authHeaders } = await createAuthenticatedUser({
        roleId: role.id,
      });

      const material = await prisma.material.create({
        data: {
          lecturerId: user.id,
          title: "Test Material",
          materialType: "text",
        },
      });

      await prisma.materialLevel.createMany({
        data: [
          { materialId: material.id, title: "Level 1", levelOrder: 1 },
          { materialId: material.id, title: "Level 2", levelOrder: 2 },
          { materialId: material.id, title: "Level 3", levelOrder: 3 },
        ],
      });

      const highestLevel = await prisma.materialLevel.findFirst({
        where: { materialId: material.id, levelOrder: 3 },
      });

      const res = await app.handle(
        new Request(
          `http://localhost/materials/${material.id}/levels/${highestLevel!.id}`,
          {
            method: "DELETE",
            headers: {
              ...authHeaders,
              "x-forwarded-for": randomIp(),
            },
          },
        ),
      );

      expect(res.status).toBe(200);

      const levelsRes = await app.handle(
        new Request(`http://localhost/materials/${material.id}/levels`, {
          method: "GET",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
        }),
      );
      const levelsBody = await levelsRes.json();
      expect(levelsBody.data.length).toBe(2);
    });

    it("should block deletion of non-highest level", async () => {
      const role = await createTestRoleWithPermissions("DeleterRole2", [
        { featureName: "material_management", action: "create" },
        { featureName: "material_management", action: "read" },
        { featureName: "material_management", action: "delete" },
      ]);
      const { user, authHeaders } = await createAuthenticatedUser({
        roleId: role.id,
      });

      const material = await prisma.material.create({
        data: {
          lecturerId: user.id,
          title: "Test Material",
          materialType: "text",
        },
      });

      await prisma.materialLevel.createMany({
        data: [
          { materialId: material.id, title: "Level 1", levelOrder: 1 },
          { materialId: material.id, title: "Level 2", levelOrder: 2 },
          { materialId: material.id, title: "Level 3", levelOrder: 3 },
        ],
      });

      const middleLevel = await prisma.materialLevel.findFirst({
        where: { materialId: material.id, levelOrder: 2 },
      });

      const res = await app.handle(
        new Request(
          `http://localhost/materials/${material.id}/levels/${middleLevel!.id}`,
          {
            method: "DELETE",
            headers: {
              ...authHeaders,
              "x-forwarded-for": randomIp(),
            },
          },
        ),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toContain("Cannot delete level");
    });
  });

  describe("RBAC", () => {
    it("should return 401 without authentication", async () => {
      const role = await createTestRoleWithPermissions("TestRole", [
        { featureName: "material_management", action: "create" },
      ]);
      const { user } = await createAuthenticatedUser({ roleId: role.id });

      const material = await prisma.material.create({
        data: {
          lecturerId: user.id,
          title: "Test Material",
          materialType: "text",
        },
      });

      const res = await app.handle(
        new Request(`http://localhost/materials/${material.id}/levels`, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": randomIp(),
          },
        }),
      );

      expect(res.status).toBe(401);
    });

    it("should return 403 without proper permission", async () => {
      const role = await createTestRoleWithPermissions("NoPermRole", [
        { featureName: "other_feature", action: "read" },
      ]);
      const { user, authHeaders } = await createAuthenticatedUser({
        roleId: role.id,
      });

      const material = await prisma.material.create({
        data: {
          lecturerId: user.id,
          title: "Test Material",
          materialType: "text",
        },
      });

      const res = await app.handle(
        new Request(`http://localhost/materials/${material.id}/levels`, {
          method: "GET",
          headers: {
            ...authHeaders,
            "x-forwarded-for": randomIp(),
          },
        }),
      );

      expect(res.status).toBe(403);
    });
  });
});
