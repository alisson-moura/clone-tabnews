import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";

const EXPIRATION_TIME_IN_MS = 1000 * 60 * 15;

async function sendActivationEmailToUser(user, token) {
  await email.send({
    to: user.email,
    subject: "Ative sua conta no Clone TabNews",
    text: `Olá ${user.username},\n\nPara ativar sua conta, clique no link abaixo:\n\n${webserver.origin}/cadastro/ativar/${token}\n\nObrigado por se registrar no Clone TabNews!`,
  });
}

async function createActivationToken(userId) {
  return await runInsertQuery(
    userId,
    new Date(Date.now() + EXPIRATION_TIME_IN_MS),
  );

  async function runInsertQuery(userId, expires_at) {
    const result = await database.query({
      text: `
                INSERT INTO user_activation_tokens
                    (user_id, expires_at)
                VALUES 
                    ($1, $2)
                RETURNING 
                    *
            `,
      values: [userId, expires_at],
    });

    return result.rows[0];
  }
}

async function findOneByUserId(userId) {
  const result = await database.query({
    text: `
      SELECT * FROM user_activation_tokens
      WHERE user_id = $1
    `,
    values: [userId],
  });

  return result.rows[0];
}

const activation = {
  sendActivationEmailToUser,
  createActivationToken,
  findOneByUserId,
};
export default activation;
