import database from "infra/database";
import { ValidationError } from "infra/errors";

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);
  const user = await runInsert(userInputValues);
  return user;
}

async function validateUniqueEmail(email) {
  const result = await database.query({
    text: `
        SELECT * FROM
            users
        WHERE
            LOWER(email) = LOWER($1)
        `,
    values: [email],
  });
  if (result.rowCount > 0)
    throw new ValidationError({
      message: "Este email já está em uso.",
      action: "Tente outro email.",
    });
}

async function validateUniqueUsername(username) {
  const result = await database.query({
    text: `
        SELECT * FROM
            users
        WHERE
            LOWER(username) = LOWER($1)
        `,
    values: [username],
  });
  if (result.rowCount > 0)
    throw new ValidationError({
      message: "Este username já está em uso.",
      action: "Tente outro username.",
    });
}

async function runInsert(userInputValues) {
  const results = await database.query({
    text: `
        INSERT INTO users 
            (username, email, password)
        VALUES
            ($1, $2, $3)
        RETURNING
            *
        ;`,
    values: [
      userInputValues.username,
      userInputValues.email,
      userInputValues.password,
    ],
  });

  return results.rows[0];
}

const user = {
  create,
};

export default user;
