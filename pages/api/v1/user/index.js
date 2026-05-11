import { createRouter } from "next-connect";
import controller from "infra/controller";
import { session } from "models/session";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandler);

async function getHandler(request, response) {
  const { session: activeSession, user } = request.context;

  const renewedSession = await session.renew(activeSession.id);
  controller.setSessionCookie(renewedSession.token, response);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidade",
  );
  return response.status(200).json(user);
}
