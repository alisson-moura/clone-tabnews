import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import password from "models/password";
import user from "models/user";

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

      const userInDb = await user.findOneByUsername("alisson.moura");
      const correctPasswordMatch = await password.compare(
        "123456",
        userInDb.password,
      );
      const incorrectPasswordMatch = await password.compare(
        "senha-errada",
        userInDb.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("Com e-mail duplicado", async () => {
      await orchestrator.createUser({
        email: "emailduplicado@mail.com",
      });

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "username-02",
          email: "emailduplicado@mail.com",
          password: "123456",
        }),
      });
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody).toEqual({
        message: "Este email já está em uso.",
        action: "Tente outro email.",
        status_code: 400,
        name: "ValidationError",
      });
    });

    test("Com username duplicado", async () => {
      await orchestrator.createUser({
        username: "userNameDuplicado",
      });

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "userNameDuplicado",
          email: "email02@mail.com",
          password: "123456",
        }),
      });
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody).toEqual({
        message: "Este username já está em uso.",
        action: "Tente outro username.",
        status_code: 400,
        name: "ValidationError",
      });
    });
  });
});
