import database from "infra/database";
import { ValidationError, NotFoundError } from "infra/errors";
import password from "./password";

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);
  await hashPasswordInObject(userInputValues);
  const user = await runInsert(userInputValues);
  return user;
}

async function findOneByUsername(username) {
  const user = await validateUsernameExists(username);
  return user;
}

async function findOneByEmail(email) {
  const user = await validateEmailExists(email);
  return user;
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if (Object.hasOwn(userInputValues, "username")) {
    const newUsername = userInputValues.username;

    if (newUsername.toLowerCase() !== currentUser.username.toLowerCase())
      await validateUniqueUsername(userInputValues.username);
  }

  if (Object.hasOwn(userInputValues, "email"))
    await validateUniqueEmail(userInputValues.email);

  if (Object.hasOwn(userInputValues, "password"))
    await hashPasswordInObject(userInputValues);

  const userWithNewValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);

  return updatedUser;

  async function runUpdateQuery(user) {
    const results = await database.query({
      text: `
      UPDATE
        users
      SET
        username = $2,
        email = $3,
        password = $4,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      `,
      values: [user.id, user.username, user.email, user.password],
    });

    return results.rows[0];
  }
}

async function hashPasswordInObject(userInputValues) {
  userInputValues.password = await password.hash(userInputValues.password);
}

async function validateUsernameExists(username) {
  const result = await runSelectWithUsername(username);

  if (result.rowCount === 0)
    throw new NotFoundError({
      message:
        "Não foi possível encontrar um usuário com este username no sistema.",
      action: "Verifique se o username está correto.",
    });

  return result.rows[0];
}

async function validateEmailExists(email) {
  const result = await runSelectWithEmail(email);

  if (result.rowCount === 0)
    throw new NotFoundError({
      message:
        "Não foi possível encontrar um usuário com este e-mail no sistema.",
      action: "Verifique se o e-mail está correto.",
    });

  return result.rows[0];
}

async function validateUniqueEmail(email) {
  const result = await runSelectWithEmail(email);
  if (result.rowCount > 0)
    throw new ValidationError({
      message: "Este email já está em uso.",
      action: "Tente outro email.",
    });
}

async function validateUniqueUsername(username) {
  const result = await runSelectWithUsername(username);
  if (result.rowCount > 0)
    throw new ValidationError({
      message: "Este username já está em uso.",
      action: "Tente outro username.",
    });
}

async function runSelectWithUsername(username) {
  const results = await database.query({
    text: `
        SELECT * FROM
            users
        WHERE
            LOWER(username) = LOWER($1)
        `,
    values: [username],
  });
  return results;
}

async function runSelectWithEmail(email) {
  const results = await database.query({
    text: `
        SELECT * FROM
            users
        WHERE
            LOWER(email) = LOWER($1)
        `,
    values: [email],
  });
  return results;
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
  findOneByUsername,
  findOneByEmail,
  update,
};

export default user;
