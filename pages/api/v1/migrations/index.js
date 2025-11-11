import { createRouter } from "next-connect";
import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandler);

async function postHandler(request, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const defaultMigrationRunnerConfig = {
      dbClient,
      dryRun: false,
      dir: resolve("infra", "migrations"),
      direction: "up",
      migrationsTable: "pgmigrations",
      verbose: true,
    };

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationRunnerConfig,
      dryRun: false,
    });
    const statusCode = migratedMigrations.length > 0 ? 201 : 200;
    return response.status(statusCode).json(migratedMigrations);
  } finally {
    await dbClient.end();
  }
}

async function getHandler(request, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const defaultMigrationRunnerConfig = {
      dbClient,
      dryRun: true,
      dir: resolve("infra", "migrations"),
      direction: "up",
      migrationsTable: "pgmigrations",
      verbose: true,
    };
    const pendingMigrations = await migrationRunner(
      defaultMigrationRunnerConfig,
    );
    return response.status(200).json(pendingMigrations);
  } finally {
    await dbClient.end();
  }
}
