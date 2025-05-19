import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("Anônimo", () => {
  describe("Uma ou mais migrations pendentes", () => {
    test("POST /api/v1/migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
      });
      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });

  describe("Nenhuma migration pendente", () => {
    beforeEach(async () => {
      await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
      });
    });
    test("POST /api/v1/migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
      });
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.length).toEqual(0);
    });
  });

  describe("Database status", () => {
    test("Ensure all database connections are closed afterwards", async () => {
      // Dispara a requisição para executar as migrações
      await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
      });

      // Verifica o status atual das conexões no banco de dados
      const responseStatus = await fetch("http://localhost:3000/api/v1/status");
      const bodyStatus = await responseStatus.json();

      // Garante que após a execução das migrações, apenas a conexão ativa seja mantida
      expect(bodyStatus.dependencies.database.opened_connections).toBe(1);
    });
  });
});
