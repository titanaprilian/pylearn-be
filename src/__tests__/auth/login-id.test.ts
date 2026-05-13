import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { app } from "@/server";
import { prisma } from "@/libs/prisma";
import { createTestUser, resetDatabase, randomIp } from "../test_utils";

describe("POST /auth/login-id", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should login successfully with user_id and return tokens", async () => {
    const user = await createTestUser({
      email: "loginid@test.com",
      userId: "testuser",
    });

    const response = await app.handle(
      new Request("http://localhost/auth/login-id", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          user_id: "testuser",
          password: "password123",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.access_token).toBeDefined();
    expect(body.data.refresh_token).toBeDefined();
    expect(typeof body.data.access_token).toBe("string");
    expect(body.data.user.id).toBe(user.id);
    expect(body.data.user.email).toBe("loginid@test.com");
  });

  it("should return 401 for non-existent user_id", async () => {
    await createTestUser({
      email: "exists@test.com",
      userId: "exists",
    });

    const response = await app.handle(
      new Request("http://localhost/auth/login-id", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          user_id: "nonexistent",
          password: "password123",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.message).toBe("Invalid credentials");
  });

  it("should return 401 for incorrect password", async () => {
    await createTestUser({
      email: "wrongpass@test.com",
      userId: "wrongpass",
    });

    const response = await app.handle(
      new Request("http://localhost/auth/login-id", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          user_id: "wrongpass",
          password: "wrong_password",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.message).toBe("Invalid credentials");
  });

  it("should return 401 for disabled account", async () => {
    await createTestUser({
      email: "disabled@test.com",
      userId: "disabled",
      isActive: false,
    });

    const response = await app.handle(
      new Request("http://localhost/auth/login-id", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          user_id: "disabled",
          password: "password123",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.message).toBe("Your account has been disabled.");
  });

  it("should set a secure httpOnly cookie in the response", async () => {
    await createTestUser({
      email: "cookie@test.com",
      userId: "cookieuser",
    });

    const response = await app.handle(
      new Request("http://localhost/auth/login-id", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          user_id: "cookieuser",
          password: "password123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).not.toBeNull();

    expect(setCookieHeader).toContain("refresh_token=");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("Path=/");
    expect(setCookieHeader).toContain("SameSite=Lax");
  });

  it("should return 400 for missing user_id", async () => {
    const response = await app.handle(
      new Request("http://localhost/auth/login-id", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          password: "password123",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("should return 400 for missing password", async () => {
    await createTestUser({
      email: "nopass@test.com",
      userId: "nopass",
    });

    const response = await app.handle(
      new Request("http://localhost/auth/login-id", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          user_id: "nopass",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("should return 400 for user_id too short", async () => {
    const response = await app.handle(
      new Request("http://localhost/auth/login-id", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          user_id: "ab",
          password: "password123",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("should return 400 for user_id too long", async () => {
    const response = await app.handle(
      new Request("http://localhost/auth/login-id", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          user_id: "abcdefghijklmnopqrstuvwxyz",
          password: "password123",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("should work without user_id (login by email still works)", async () => {
    const user = await createTestUser({
      email: "nouserid@test.com",
    });

    const response = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": randomIp(),
        },
        body: JSON.stringify({
          email: "nouserid@test.com",
          password: "password123",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.user.id).toBe(user.id);
  });
});
