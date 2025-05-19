import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.waitForAllServices();
});

describe("Anônimo", () => {
  test("GET /api/v1/migrations", async () => {
    const response = await fetch("http://localhost:3000/api/v1/migrations");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
  describe("Database  status", () => {
    test("Ensure all database connections are closed afterwards", async () => {
      // Realiza a requisição para obter a lista de migrações pendentes
      await fetch("http://localhost:3000/api/v1/migrations");

      // Verifica o status atual das conexões no banco de dados
      const responseStatus = await fetch("http://localhost:3000/api/v1/status");
      const bodyStatus = await responseStatus.json();

      // Garante que apenas a conexão ativa seja mantida após a execução do endpoint
      expect(bodyStatus.dependencies.database.opened_connections).toBe(1);
    });
  });
});
