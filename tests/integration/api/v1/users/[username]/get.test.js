import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runMigrations();
});

describe("GET /api/v1/users", () => {
  describe("Anônimo", () => {
    test("Com case iguais", async () => {
      await orchestrator.createUser({
        username: "MesmoCase",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/MesmoCase",
      );
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.username).toBe("MesmoCase");
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Com case diferentes", async () => {
      await orchestrator.createUser({
        username: "CaseDiferente",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/casediferente",
      );
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.username).toBe("CaseDiferente");
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
    test("Com username inexistente", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/username-inexistente",
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
  });
});
