import { createRouter } from "next-connect";
import controller from "infra/controller";
import { authentication } from "models/authentication";
import { session } from "models/session";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

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

async function deleteHandler(request, response) {
  const sessionObject = await session.findOneValidByToken(
    request.cookies.session_id,
  );

  const sessionExpired = await session.expireById(sessionObject.id);
  controller.clearSessionCookie(response);

  return response.status(200).json(sessionExpired);
}
