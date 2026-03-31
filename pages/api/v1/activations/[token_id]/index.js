import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();
router.patch(patchHandler);
export default router.handler(controller.errorHandler);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;

  const validToken = await activation.findOneValidById(activationTokenId);
  await activation.activateUserByUserId(validToken.user_id);
  const usedActivationToken = await activation.markTokenAsUsed(validToken.id);

  return response.status(200).json(usedActivationToken);
}
