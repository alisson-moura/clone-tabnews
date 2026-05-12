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
});

describe("PATCH /api/v1/users", () => {
  describe("Com usuário Anônimo", () => {
    test("Com username unico", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "novoUsername",
          }),
        },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Com usuário logado (default user)", () => {
    let createdUser;
    let session;

    beforeEach(async () => {
      createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      session = await orchestrator.createSession(createdUser.id);
    });

    test("Com username inexistente", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/username-inexistente",
        {
          method: "PATCH",
          body: JSON.stringify({}),
          headers: {
            Cookie: `session_id=${session.token}`,
          },
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
      const createdUserTwo = await orchestrator.createUser();
      await orchestrator.activateUser(createdUserTwo);
      const currentSession = await orchestrator.createSession(
        createdUserTwo.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUserTwo.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            username: createdUser.username,
          }),
          headers: {
            Cookie: `session_id=${currentSession.token}`,
          },
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
      const createdUserTwo = await orchestrator.createUser();
      await orchestrator.activateUser(createdUserTwo);
      const currentSession = await orchestrator.createSession(
        createdUserTwo.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUserTwo.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            email: createdUser.email,
          }),
          headers: {
            Cookie: `session_id=${currentSession.token}`,
          },
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
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "novoUsername",
          }),
          headers: {
            Cookie: `session_id=${session.token}`,
          },
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.username).toBe("novoUsername");
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("Com email unico", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            email: "novoEmail@curso.dev.com",
          }),
          headers: {
            Cookie: `session_id=${session.token}`,
          },
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.email).toBe("novoEmail@curso.dev.com");
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("Com uma senha nova", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            password: "novaSenha",
          }),
          headers: {
            Cookie: `session_id=${session.token}`,
          },
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDb = await user.findOneByUsername(createdUser.username);
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
