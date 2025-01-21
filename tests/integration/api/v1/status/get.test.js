import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

test("GET to /api/v1/status should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.updated_at).toEqual(new Date(body.updated_at).toISOString());
  expect(body.dependencies.database.version).toEqual("16.6");
  expect(body.dependencies.database.max_connections).toBeGreaterThan(1);
  expect(body.dependencies.database.opened_connections).toBe(1);
});
