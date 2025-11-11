import { InternalServerError, MethodNotAllowedError } from "infra/errors";

function onNoMatchHandler(request, response) {
  const publicError = new MethodNotAllowedError();
  response.status(publicError.statusCode).json(publicError);
}

function onErrorHandler(err, request, response) {
  const publicError = new InternalServerError({
    cause: err,
    statusCode: err.statusCode,
  });
  return response.status(err.statusCode).json(publicError);
}

const controller = {
  errorHandler: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
