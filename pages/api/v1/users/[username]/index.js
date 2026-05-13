import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandler);

async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);
  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const userTryingToPatch = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (authorization.cannot(userTryingToPatch, "update:user", targetUser))
    throw new ForbiddenError({
      message: "Você não possui permissão para editar outro usuário.",
      action: "Verifique se possui a feature necessária.",
    });

  const updatedUser = await user.update(username, JSON.parse(userInputValues));

  return response.status(200).json(updatedUser);
}
