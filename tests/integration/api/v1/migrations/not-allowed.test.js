import database from "infra/database";

async function cleanDatabase() {
  await database.query("DROP SCHEMA public CASCADE;CREATE SCHEMA public;");
}

beforeAll(cleanDatabase);

test("DELETE to /api/v1/migrations should return 405 Method Not Allowed", async () => {
  // Realiza uma requisição DELETE para um endpoint que não suporta este método
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "DELETE",
  });

  // Verifica se o status da resposta é 405 (Method Not Allowed)
  expect(response.status).toBe(405);
});

test("DELETE to /api/v1/migrations should not open new database connections", async () => {
  // Realiza uma requisição DELETE para um endpoint que não suporta este método
  await fetch("http://localhost:3000/api/v1/migrations", {
    method: "DELETE",
  });

  // Verifica o status atual das conexões no banco de dados
  const responseStatus = await fetch("http://localhost:3000/api/v1/status");
  const bodyStatus = await responseStatus.json();

  // Garante que nenhuma nova conexão foi aberta devido ao uso de métodos não permitidos
  expect(bodyStatus.dependencies.database.opened_connections).toBe(1);
});
