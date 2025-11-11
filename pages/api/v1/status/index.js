import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandler);

async function getHandler(request, response) {
  const versionResult = await database.query("SHOW server_version;");
  const maxConnections = await database.query("SHOW max_connections;");
  const openedConnections = await database.query({
    text: "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [process.env.POSTGRES_DB],
  });

  return response.status(200).json({
    updated_at: new Date().toISOString(),
    dependencies: {
      database: {
        version: versionResult.rows[0].server_version,
        max_connections: parseInt(maxConnections.rows[0].max_connections),
        opened_connections: openedConnections.rows[0].count,
      },
    },
  });
}
