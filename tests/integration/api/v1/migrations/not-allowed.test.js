import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("Anônimo", () => {
  test("DELETE /api/v1/migrations", async () => {
    // Realiza uma requisição DELETE para um endpoint que não suporta este método
    const response = await fetch("http://localhost:3000/api/v1/migrations", {
      method: "DELETE",
    });

    // Verifica se o status da resposta é 405 (Method Not Allowed)
    expect(response.status).toBe(405);
  });
});
