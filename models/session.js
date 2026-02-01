import crypto from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MS = 60 * 60 * 24 * 30 * 1000; // 30 DAYS

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const createdAt = new Date();
  const expiresAt = calculateExpiresAt(createdAt.getTime());

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

async function findOneValidByToken(token) {
  if (!token) throw genericUnauthorizedError();

  const results = await database.query({
    text: "SELECT * FROM sessions WHERE token = $1  AND expires_at > NOW() LIMIT 1",
    values: [token],
  });

  if (results.rowCount < 1) throw genericUnauthorizedError();

  return results.rows[0];
}

async function renew(sessionId) {
  const results = await runUpdateQuery(sessionId, calculateExpiresAt());
  return results.rows[0];

  async function runUpdateQuery(sessionId, expiresAt) {
    return await database.query({
      text: `
      UPDATE
        sessions
      SET 
        expires_at = $2,
        updated_at = NOW()
      WHERE
        id = $1
      RETURNING
        *
      `,
      values: [sessionId, expiresAt],
    });
  }
}

const calculateExpiresAt = (createdAt = Date.now()) =>
  new Date(createdAt + EXPIRATION_IN_MS);

function genericUnauthorizedError() {
  return new UnauthorizedError({
    message: "Usuário não possui sessão ativa.",
    action: "Verifique se este usuário está logado e tente novamente.",
  });
}

export const session = {
  renew,
  create,
  findOneValidByToken,
  EXPIRATION_IN_MS,
};
