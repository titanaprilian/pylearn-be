import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { app } from "@/server";
import { prisma } from "@/libs/prisma";
import {
  createAuthenticatedUser,
  createTestRoleWithPermissions,
  resetDatabase,
} from "../test_utils";

describe("Quiz Questions API", () => {
  let authHeaders: any;
  let materialId: string;
  let levelId: string;
  let quizId: string;

  beforeEach(async () => {
    await resetDatabase();

    // Setup Material, Level, and Quiz
    const role = await createTestRoleWithPermissions("Admin", [
      { featureName: "material_management", action: "create" },
      { featureName: "material_management", action: "read" },
      { featureName: "quiz_management", action: "create" },
      { featureName: "quiz_management", action: "read" },
      { featureName: "quiz_management", action: "update" },
      { featureName: "quiz_management", action: "delete" },
    ]);

    const auth = await createAuthenticatedUser({ roleId: role.id });
    authHeaders = auth.authHeaders;

    const mResponse = await app.handle(
      new Request("http://localhost/materials", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          lecturerId: auth.user.id,
          title: "Test Material",
          materialType: "text",
        }),
      }),
    );
    const mBody = await mResponse.json();
    materialId = mBody.data.id;

    const lResponse = await app.handle(
      new Request(`http://localhost/materials/${materialId}/levels`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ title: "Level 1" }),
      }),
    );
    const lBody = await lResponse.json();
    levelId = lBody.data.id;

    // Use the flattened POST /quizzes endpoint from earlier
    const qResponse = await app.handle(
      new Request("http://localhost/quizzes", {
        method: "POST",
        headers: {
          ...authHeaders,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Quiz 1",
          levelId: levelId,
        }),
      }),
    );
    const qBody = await qResponse.json();
    quizId = qBody.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /quizzes/questions", () => {
    it("should create questions with sequential order", async () => {
      // First question
      const res1 = await app.handle(
        new Request("http://localhost/quizzes/questions", {
          method: "POST",
          headers: {
            ...authHeaders,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            quizId: quizId, // Included in body
            questionText: "Question 1",
            answerText: "Answer 1",
            maxScore: 50,
          }),
        }),
      );
      expect(res1.status).toBe(201);
      const body1 = await res1.json();
      expect(body1.data.questionOrder).toBe(1);
      expect(body1.data.questionText).toBe("Question 1");
      expect(body1.data.answerText).toBe("Answer 1");
      expect(body1.data.maxScore).toBe(50);

      // Second question
      const res2 = await app.handle(
        new Request("http://localhost/quizzes/questions", {
          method: "POST",
          headers: {
            ...authHeaders,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            quizId: quizId, // Included in body
            questionText: "Question 2",
            answerText: "Answer 2",
          }),
        }),
      );
      expect(res2.status).toBe(201);
      const body2 = await res2.json();
      expect(body2.data.questionOrder).toBe(2);
      expect(body2.data.answerText).toBe("Answer 2");
      expect(body2.data.maxScore).toBe(100); // Default
    });
  });

  describe("GET /quizzes/questions", () => {
    it("should list questions with quiz title", async () => {
      await prisma.quizQuestion.create({
        data: {
          quizId: BigInt(quizId),
          questionText: "Question 1",
          answerText: "Answer 1",
          questionOrder: 1,
        },
      });

      const res = await app.handle(
        new Request(`http://localhost/quizzes/questions?quizId=${quizId}`, {
          method: "GET",
          headers: authHeaders,
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.length).toBe(1);
      expect(body.data[0].quizTitle).toBe("Quiz 1");
      expect(body.data[0].quizId).toBe(quizId);
      expect(body.data[0].answerText).toBe("Answer 1");
    });
  });

  describe("PATCH /quizzes/questions/:id", () => {
    it("should update question text and max score", async () => {
      const q = await prisma.quizQuestion.create({
        data: {
          quizId: BigInt(quizId),
          questionText: "Original Text",
          answerText: "Original Answer",
          maxScore: 10,
          questionOrder: 1,
        },
      });

      const res = await app.handle(
        new Request(`http://localhost/quizzes/questions/${q.id.toString()}`, {
          method: "PATCH",
          headers: {
            ...authHeaders,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            questionText: "Updated Text",
            answerText: "Updated Answer",
            maxScore: 20,
          }),
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.questionText).toBe("Updated Text");
      expect(body.data.answerText).toBe("Updated Answer");
      expect(body.data.maxScore).toBe(20);
    });
  });

  describe("DELETE /quizzes/questions/:id", () => {
    it("should allow deletion if not the last question", async () => {
      const q1 = await prisma.quizQuestion.create({
        data: {
          quizId: BigInt(quizId),
          questionText: "Q1",
          answerText: "A1",
          questionOrder: 1,
        },
      });
      await prisma.quizQuestion.create({
        data: {
          quizId: BigInt(quizId),
          questionText: "Q2",
          answerText: "A2",
          questionOrder: 2,
        },
      });

      const res = await app.handle(
        new Request(`http://localhost/quizzes/questions/${q1.id.toString()}`, {
          method: "DELETE",
          headers: authHeaders,
        }),
      );

      expect(res.status).toBe(200);
    });

    it("should allow deletion of the last question", async () => {
      const q1 = await prisma.quizQuestion.create({
        data: {
          quizId: BigInt(quizId),
          questionText: "Q1",
          answerText: "A1",
          questionOrder: 1,
        },
      });

      const res = await app.handle(
        new Request(`http://localhost/quizzes/questions/${q1.id.toString()}`, {
          method: "DELETE",
          headers: authHeaders,
        }),
      );

      expect(res.status).toBe(200);
      const count = await prisma.quizQuestion.count({
        where: { quizId: BigInt(quizId) },
      });
      expect(count).toBe(0);
    });
  });
});
