import { NotFoundError, UnauthorizedError } from "infra/errors";
import user from "models/user";
import password from "models/password";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  const storagedUser = await getUserByEmail(providedEmail);
  await validateUserPassword(providedPassword, storagedUser.password);
  return storagedUser;

  async function getUserByEmail(email) {
    try {
      const storagedUser = await user.findOneByEmail(email);
      return storagedUser;
    } catch (error) {
      if (error instanceof NotFoundError) throw genericAuthenticationError();

      throw error;
    }
  }

  async function validateUserPassword(plainPassword, hashedPassword) {
    const userPasswordMatch = await password.compare(
      plainPassword,
      hashedPassword,
    );
    if (!userPasswordMatch) throw genericAuthenticationError();
  }
}

function genericAuthenticationError() {
  return new UnauthorizedError({
    message: "Credênciais inválidas.",
    action: "Forneça as credênciais corretas.",
  });
}

export const authentication = {
  getAuthenticatedUser,
};
