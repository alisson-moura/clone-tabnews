import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anônimo", () => {
    test("Com dados válidos", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "alisson.moura",
          email: "alisson.moura@mail.com",
          password: "123456",
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Com e-mail duplicado", async () => {
      const firstResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "username-01",
          email: "emailduplicado@mail.com",
          password: "123456",
        }),
      });
      expect(firstResponse.status).toBe(201);

      const secondResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "username-02",
          email: "Emailduplicado@mail.com",
          password: "123456",
        }),
      });
      const responseBody = await secondResponse.json();

      expect(secondResponse.status).toBe(400);
      expect(responseBody).toEqual({
        message: "Este email já está em uso.",
        action: "Tente outro email.",
        status_code: 400,
        name: "ValidationError",
      });
    });

    test("Com username duplicado", async () => {
      const firstResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "username.duplicado",
          email: "email01@mail.com",
          password: "123456",
        }),
      });
      expect(firstResponse.status).toBe(201);

      const secondResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "username.duplicado",
          email: "email02@mail.com",
          password: "123456",
        }),
      });
      const responseBody = await secondResponse.json();

      expect(secondResponse.status).toBe(400);
      expect(responseBody).toEqual({
        message: "Este username já está em uso.",
        action: "Tente outro username.",
        status_code: 400,
        name: "ValidationError",
      });
    });
  });
});
