import { createRouter } from "next-connect";
import controller from "infra/controller";
import { authentication } from "models/authentication";
import { session } from "models/session";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandler);

async function postHandler(request, response) {
  const input = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    input.email,
    input.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}
