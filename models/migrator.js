import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database";
import { ServiceError } from "infra/errors";

class Migrator {
  async listPendingMigrations() {
    return this.#runMigrations({ dryRun: true });
  }

  async runPendingMigrations() {
    return this.#runMigrations({ dryRun: false });
  }

  async #runMigrations({ dryRun = true }) {
    let dbClient;
    try {
      dbClient = await database.getNewClient();
      const migrations = await migrationRunner({
        dir: resolve("infra", "migrations"),
        direction: "up",
        migrationsTable: "pgmigrations",
        verbose: true,
        log: () => {},
        dbClient,
        dryRun,
      });
      return migrations;
    } catch (err) {
      throw new ServiceError({
        cause: err,
        message: "Erro ao executar as migrations no banco de dados.",
      });
    } finally {
      await dbClient?.end();
    }
  }
}

const migrator = new Migrator();
export default migrator;
