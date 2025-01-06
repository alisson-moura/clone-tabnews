import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database";

export default async function migrations(request, response) {
  if (request.method != "GET" && request.method != "POST") {
    response.status(405).end();
  }

  const dbClient = await database.getNewClient();
  const defaultMigrationRunnerConfig = {
    dbClient,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    verbose: true,
  };

  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner(
      defaultMigrationRunnerConfig,
    );

    await dbClient.end();
    return response.status(200).json(pendingMigrations);
  }
  if (request.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationRunnerConfig,
      dryRun: false,
    });

    await dbClient.end();
    const statusCode = migratedMigrations.length > 0 ? 201 : 200;
    return response.status(statusCode).json(migratedMigrations);
  }
}
