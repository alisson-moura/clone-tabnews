import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("Anônimo", () => {
  test("POST /api/v1/status", async () => {
    const response = await fetch("http://localhost:3000/api/v1/status", {
      method: "POST",
    });

    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body).toEqual({
      name: "MethodNotAllowed",
      message: "Método não permitido para este endpoint.",
      action: "Verifique se o método HTTP enviado está correto.",
      status_code: 405,
    });
  });
});
