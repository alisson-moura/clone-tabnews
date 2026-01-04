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

  defaultUser = await orchestrator.createUser();
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
      await orchestrator.createUser({
        username: "usernameDuplicado",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "usernameDuplicado",
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
      await orchestrator.createUser({
        email: "emailduplicado@mail.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            email: "emailduplicado@mail.com",
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
        "incorrectpassword",
        userInDb.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
