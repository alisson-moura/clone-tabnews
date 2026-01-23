import { version as uuidVersion } from "uuid";
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

describe("POST /api/v1/status", () => {
  describe("Usuário Anônimo", () => {
    test("Com e-mail incorreto mas com a senha correta", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.errado@mail.com",
          password: "senha-correta",
        }),
      });
      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        message: "Credênciais inválidas.",
        action: "Forneça as credênciais corretas.",
        status_code: 401,
        name: "UnauthorizedError",
      });
    });
    test("Com senha incorreta mas com o e-mail correto", async () => {
      await orchestrator.createUser({
        email: "email.correto@mail.com",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.correto@mail.com",
          password: "senha-incorreta",
        }),
      });
      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        message: "Credênciais inválidas.",
        action: "Forneça as credênciais corretas.",
        status_code: 401,
        name: "UnauthorizedError",
      });
    });
    test("Com senha incorreta e o e-mail incorreto", async () => {
      await orchestrator.createUser();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.incorreto@mail.com",
          password: "senha-incorreta",
        }),
      });
      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        message: "Credênciais inválidas.",
        action: "Forneça as credênciais corretas.",
        status_code: 401,
        name: "UnauthorizedError",
      });
    });
    test("Com credências corretas", async () => {
      const createdUser = await orchestrator.createUser({
        email: "email.correto@mail.com",
        password: "senha-correta",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.correto@mail.com",
          password: "senha-correta",
        }),
      });
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(uuidVersion(body.id)).toBe(4);
      expect(body.token.length).toBe(96);
      expect(body.user_id).toEqual(createdUser.id);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
      expect(Date.parse(body.expires_at)).not.toBeNaN();

      expect(Date.parse(body.expires_at) - Date.parse(body.created_at)).toBe(
        session.EXPIRATION_IN_MS,
      );

      const parsedSetCookie = setCookieParser(response.headers.getSetCookie(), {
        map: true,
      });
      expect(parsedSetCookie.session_id.name).toEqual("session_id");
      expect(parsedSetCookie.session_id.value).toEqual(body.token);
      expect(parsedSetCookie.session_id.maxAge).toEqual(
        session.EXPIRATION_IN_MS / 1000,
      );
      expect(parsedSetCookie.session_id.path).toEqual("/");
      expect(parsedSetCookie.session_id.httpOnly).toBe(true);
    });
  });
});
