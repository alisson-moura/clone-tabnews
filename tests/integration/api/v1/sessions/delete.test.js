import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator.js";
import { session } from "models/session";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("usuário autenticado", () => {
    test("Com uma sessão inexistente", async () => {
      const fakeToken = "fake_token";

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${fakeToken}`,
        },
      });
      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
        name: "UnauthorizedError",
      });
    });

    test("Com uma sessão expirada", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MS),
      });

      const user = await orchestrator.createUser({
        email: "email.correto@mail.com",
        password: "senha-correta",
      });

      const userSession = await orchestrator.createSession(user.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toEqual({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
        name: "UnauthorizedError",
      });
    });

    test("Com uma sessão válida", async () => {
      const user = await orchestrator.createUser({
        email: "email.correto@mail.com",
        password: "senha-correta",
      });
      const userSession = await orchestrator.createSession(user.id);

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });
      const body = await response.json();

      expect(response.status).toBe(200);

      expect(body.expires_at < userSession.expires_at.toISOString()).toBe(true);
      expect(body.updated_at > userSession.updated_at.toISOString()).toBe(true);

      const parsedSetCookie = setCookieParser(response.headers.getSetCookie(), {
        map: true,
      });
      expect(parsedSetCookie.session_id.maxAge).toEqual(-1);
    });
  });
});
