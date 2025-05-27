import database from "infra/database.js";
import { InternalServerError } from "infra/errors";

export default async function status(request, response) {
  try {
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
  } catch (err) {
    const publicError = new InternalServerError({ cause: err });
    console.log(publicError);
    return response.status(500).json(publicError);
  }
}
