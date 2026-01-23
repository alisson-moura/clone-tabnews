import crypto from "node:crypto";
import database from "infra/database";

const EXPIRATION_IN_MS = 60 * 60 * 24 * 30 * 1000; // 30 DAYS

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + EXPIRATION_IN_MS);

  const newSession = await runInsertQuery(token, userId, createdAt, expiresAt);
  return newSession;

  async function runInsertQuery(token, userId, createdAt, expiresAt) {
    const results = await database.query({
      text: `
                INSERT INTO
                    sessions (token, user_id, created_at, expires_at)
                VALUES
                    ($1, $2, $3, $4)
                RETURNING
                    *    
            `,
      values: [token, userId, createdAt, expiresAt],
    });
    return results.rows[0];
  }
}

export const session = {
  create,
  EXPIRATION_IN_MS,
};
