import database from "infra/database";

async function cleanDatabase() {
  await database.query("DROP SCHEMA public CASCADE;CREATE SCHEMA public;");
}

beforeEach(cleanDatabase);

test("POST to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response.status).toBe(201);
});

test("POST to /api/v1/migrations should create migrations in database", async () => {
  const firstResponse = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  const secondResponse = await fetch(
    "http://localhost:3000/api/v1/migrations",
    {
      method: "POST",
    },
  );

  const firstResponseBody = await firstResponse.json();
  const secondResponseBody = await secondResponse.json();

  expect(firstResponse.status).toBe(201);
  expect(firstResponseBody.length).toBeGreaterThan(0);

  expect(secondResponse.status).toBe(200);
  expect(secondResponseBody.length).toBe(0);
});

test("POST to /api/v1/migrations should execute migrations and ensure all database connections are closed afterwards", async () => {
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
