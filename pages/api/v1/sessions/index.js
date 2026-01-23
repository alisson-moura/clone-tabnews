import { createRouter } from "next-connect";
import * as cookie from "cookie";
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

  const setCookie = cookie.serialize("session_id", newSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MS / 1000,
    secure: process.env === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);

  return response.status(201).json(newSession);
}
