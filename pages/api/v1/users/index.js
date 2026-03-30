import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import activation from "models/activation";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandler);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const newUser = await user.create(userInputValues);

  const activationToken = await activation.createActivationToken(newUser.id);
  await activation.sendActivationEmailToUser(newUser, activationToken.id);

  return response.status(201).json(newUser);
}
