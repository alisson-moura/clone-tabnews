import * as cookie from "cookie";
import { session } from "models/session";
import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors";
import user from "models/user";
import { ForbiddenError } from "infra/errors";
import authorization from "models/authorization";

function onNoMatchHandler(request, response) {
  const publicError = new MethodNotAllowedError();
  response.status(publicError.statusCode).json(publicError);
}

function onErrorHandler(err, request, response) {
  if (
    err instanceof ValidationError ||
    err instanceof NotFoundError ||
    err instanceof UnauthorizedError ||
    err instanceof ForbiddenError
  )
    return response.status(err.statusCode).json(err);

  console.log(err);
  const publicError = new InternalServerError({
    cause: err,
    statusCode: 500,
  });
  return response.status(publicError.statusCode).json(publicError);
}

function setSessionCookie(token, response) {
  const setCookie = cookie.serialize("session_id", token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MS / 1000,
    secure: process.env === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectAuthenticatedUser(request);
  } else {
    injectAnonymousUser(request);
  }

  return next();
}

async function injectAuthenticatedUser(request) {
  const token = request.cookies.session_id;
  const validSession = await session.findOneValidByToken(token);
  const authenticatedUser = await user.findOneById(validSession.user_id);

  request.context = {
    ...request.context,
    user: authenticatedUser,
    session: validSession,
  };
}

async function injectAnonymousUser(request) {
  request.context = {
    ...request.context,
    user: {
      features: ["create:session", "read:activation_token", "create:user"],
    },
  };
}

function canRequest(feature) {
  return async function (request, response, next) {
    const { user } = request.context;

    console.log(user);

    if (authorization.can(user, feature)) return next();

    throw new ForbiddenError({
      message: "Você não tem permissão para executar essa ação.",
      action: "Verifique se o seu usuário tem a feature: " + feature,
    });
  };
}

const controller = {
  errorHandler: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
