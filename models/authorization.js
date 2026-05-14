function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) authorized = true;

  if (feature == "update:user" && resource) {
    authorized = false;

    if (user.id == resource.id || can(user, "update:user:others"))
      authorized = true;
  }

  return authorized;
}

function cannot(user, feature, resource) {
  return !can(user, feature, resource);
}

const authorization = {
  can,
  cannot,
};

export default authorization;
