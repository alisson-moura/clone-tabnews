function can(user, feature) {
  let authorized = false;

  if (user.features.includes(feature)) authorized = true;

  return authorized;
}

function cannot(user, feature) {
  return !can(user, feature);
}

const authorization = {
  can,
  cannot,
};

export default authorization;
