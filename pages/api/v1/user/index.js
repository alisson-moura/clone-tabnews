import { createRouter } from "next-connect";
import controller from "infra/controller";
import { session } from "models/session";
import user from "models/user";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandler);

async function getHandler(request, response) {
  const validSession = await session.findOneValidByToken(
    request.cookies.session_id,
  );
  const renewedSession = await session.renew(validSession.id);
  controller.setSessionCookie(renewedSession.token, response);

  const userFound = await user.findOneById(validSession.user_id);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidade",
  );
  return response.status(200).json(userFound);
}
