import { v4, version } from "uuid";
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

describe("GET /api/v1/user", () => {
  describe("Usuário Anônimo", () => {
    test("Com o Cookie session_id ausente", async () => {
      const response = await fetch("http://localhost:3000/api/v1/user", {
        method: "GET",
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
  });
  describe("Usuário logado", () => {
    test("Com o Cookie sefssion_id presente porém incorreto", async () => {
      const response = await fetch("http://localhost:3000/api/v1/user", {
        method: "GET",
        headers: {
          Cookie: `session_id=${v4()}`,
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
    test("Com o Cookie session_id presente porém expirado", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MS),
      });

      const user = await orchestrator.createUser({
        email: "email.correto@mail.com",
        password: "senha-correta",
      });

      const userSession = await orchestrator.createSession(user.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        method: "GET",
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
    test("Com o Cookie session_id presente e correto", async () => {
      const user = await orchestrator.createUser({
        email: "email.correto@mail.com",
        password: "senha-correta",
      });
      const userSession = await orchestrator.createSession(user.id);

      const response = await fetch("http://localhost:3000/api/v1/user", {
        method: "GET",
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(version(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();

      // Verifica se a sessão foi atualizada no banco de dados
      const renewedSession = await session.findOneValidByToken(
        userSession.token,
      );
      expect(renewedSession.expires_at.getTime()).toBeGreaterThan(
        userSession.expires_at.getTime(),
      );
      expect(renewedSession.updated_at.getTime()).toBeGreaterThan(
        userSession.updated_at.getTime(),
      );

      // Verifica se as instrução Set-Cookie foi enviada corretamente
      const parsedSetCookie = setCookieParser(response.headers.getSetCookie(), {
        map: true,
      });
      expect(parsedSetCookie.session_id.name).toEqual("session_id");
      expect(parsedSetCookie.session_id.value).toEqual(renewedSession.token);
      expect(parsedSetCookie.session_id.maxAge).toEqual(
        session.EXPIRATION_IN_MS / 1000,
      );
      expect(parsedSetCookie.session_id.path).toEqual("/");
      expect(parsedSetCookie.session_id.httpOnly).toBe(true);

      // Verifica se o header Cache-Control foi configurado
      const headerCacheControl = response.headers.get("Cache-Control");
      expect(headerCacheControl).toEqual(
        "no-store, no-cache, max-age=0, must-revalidade",
      );
    });
    test("Com uma sessão válida porém com metade do tempo de expiração", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MS / 2),
      });

      const user = await orchestrator.createUser({
        email: "email.correto@mail.com",
        password: "senha-correta",
      });
      const userSession = await orchestrator.createSession(user.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        method: "GET",
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      // Verifica se a sessão foi atualizada no banco de dados
      const renewedSession = await session.findOneValidByToken(
        userSession.token,
      );
      expect(renewedSession.expires_at.getTime()).toBeGreaterThan(
        userSession.expires_at.getTime(),
      );
      expect(renewedSession.updated_at.getTime()).toBeGreaterThan(
        userSession.updated_at.getTime(),
      );

      // Verifica se as instrução Set-Cookie foi enviada corretamente
      const parsedSetCookie = setCookieParser(response.headers.getSetCookie(), {
        map: true,
      });
      expect(parsedSetCookie.session_id.name).toEqual("session_id");
      expect(parsedSetCookie.session_id.value).toEqual(renewedSession.token);
      expect(parsedSetCookie.session_id.maxAge).toEqual(
        session.EXPIRATION_IN_MS / 1000,
      );
      expect(parsedSetCookie.session_id.path).toEqual("/");
      expect(parsedSetCookie.session_id.httpOnly).toBe(true);
    });
  });
});
