import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
} from "infra/errors";

function onNoMatchHandler(request, response) {
  const publicError = new MethodNotAllowedError();
  response.status(publicError.statusCode).json(publicError);
}

function onErrorHandler(err, request, response) {
  if (err instanceof ValidationError)
    return response.status(err.statusCode).json(err);

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
