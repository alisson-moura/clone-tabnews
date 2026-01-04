import orchestrator from "tests/orchestrator.js";
import password from "models/password";
import user from "models/user";

let defaultUser;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runMigrations();

  // cria usuário
  const response = await fetch("http://localhost:3000/api/v1/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "MesmoCase",
      email: "mesmo.case@mail.com",
      password: "123456",
    }),
  });

  defaultUser = await response.json();
});

describe("PATCH /api/v1/users", () => {
  describe("Anônimo", () => {
    test("Com username inexistente", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/username-inexistente",
        {
          method: "PATCH",
          body: JSON.stringify({}),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        message:
          "Não foi possível encontrar um usuário com este username no sistema.",
        action: "Verifique se o username está correto.",
        status_code: 404,
        name: "NotFoundError",
      });
    });

    test("Com username duplicado", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user01",
          email: "email01@mail.com",
          password: "123456",
        }),
      });
      expect(user1Response.status).toBe(201);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user02",
          email: "email02@mail.com",
          password: "123456",
        }),
      });
      expect(user2Response.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/user02",
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "user01",
          }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody).toEqual({
        message: "Este username já está em uso.",
        action: "Tente outro username.",
        status_code: 400,
        name: "ValidationError",
      });
    });

    test("Com e-mail duplicado", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user01",
          email: "email01@mail.com",
          password: "123456",
        }),
      });
      expect(user1Response.status).toBe(201);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user02",
          email: "email02@mail.com",
          password: "123456",
        }),
      });
      expect(user2Response.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/user02",
        {
          method: "PATCH",
          body: JSON.stringify({
            email: "email01@mail.com",
          }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody).toEqual({
        message: "Este email já está em uso.",
        action: "Tente outro email.",
        status_code: 400,
        name: "ValidationError",
      });
    });

    test("Com username unico", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "novoUsername",
          }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.username).toBe("novoUsername");
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("Com email unico", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            email: "novoEmail@curso.dev.com",
          }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.email).toBe("novoEmail@curso.dev.com");
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("Com uma senha nova", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            password: "novaSenha",
          }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDb = await user.findOneByUsername(defaultUser.username);
      const correctPasswordMatch = await password.compare(
        "novaSenha",
        userInDb.password,
      );
      const incorrectPasswordMatch = await password.compare(
        "123456", // senha antiga
        userInDb.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
